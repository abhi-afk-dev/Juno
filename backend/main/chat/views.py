from django.views.decorators.csrf import csrf_exempt
from django.http import StreamingHttpResponse, JsonResponse
from django.core.paginator import Paginator
from .models import Chat
import google.generativeai as genai
import base64
import json
import os
import time

from .tools import internet_search_tool, AVAILABLE_TOOLS

Aiselected_Model = "Gemini-Flash"
KEEPALIVE_INTERVAL = 15

# ... (The helper functions sse_event, sse_comment, interface_fetch, 
#      extract_prompt_summary, and convert_to_gemini_history do not need any changes) ...
def sse_event(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"

def sse_comment() -> str:
    return ":\n\n"

def interface_fetch(request):
    latest_entry = Chat.objects.order_by('-date_time').first()

    if not latest_entry:
        return JsonResponse({"result": [], "message": "No conversations found."}, status=200)

    latest_conversation_name = latest_entry.conversation_name
    conversation_chats = Chat.objects.filter(
        conversation_name=latest_conversation_name
    ).order_by('date_time')

    formatted_conversation = [
        {
            "id": chat.id,
            "prompt": chat.prompt,
            "result": chat.result,
            "date_time": chat.date_time.isoformat(),
            "conversation_name": chat.conversation_name
        } for chat in conversation_chats
    ]
    return JsonResponse({"result": formatted_conversation}, status=200)

def extract_prompt_summary(messages_history):
    latest_user_prompt_summary = ""
    if messages_history and messages_history[-1].get('role') == 'user':
        last_user_message_content = messages_history[-1].get('content')
        if isinstance(last_user_message_content, str):
            latest_user_prompt_summary = last_user_message_content
        elif isinstance(last_user_message_content, list):
            text_parts = []
            media_types_present = set()
            for part in last_user_message_content:
                if part.get('type') == 'text':
                    text_content = part.get('text', '')
                    if text_content:
                        text_parts.append(text_content)
                elif part.get('type') == 'image_url':
                    media_types_present.add("image")
                elif part.get('type') == 'file_url':
                    media_types_present.add("file")

            latest_user_prompt_summary = " ".join(text_parts).strip()
            if media_types_present:
                media_tag = f" [Includes: {', '.join(sorted(list(media_types_present)))}]"
                latest_user_prompt_summary = (latest_user_prompt_summary + media_tag).strip()
            if not latest_user_prompt_summary:
                latest_user_prompt_summary = f"[Only media: {', '.join(sorted(list(media_types_present)))}]"
    return latest_user_prompt_summary

def convert_to_gemini_history(messages_history):
    gemini_formatted_history = []
    for msg in messages_history:
        role = 'model' if msg.get('role') == 'assistant' else 'user'
        content_for_gemini = []

        if isinstance(msg.get('content'), str):
            content_for_gemini.append({"text": msg['content']})
        elif isinstance(msg.get('content'), list):
            for part in msg['content']:
                if part.get('type') == 'text':
                    text_content = part.get('text', '')
                    if text_content:
                        content_for_gemini.append({"text": text_content})
                elif part.get('type') == 'image_url':
                    image_url_info = part.get('image_url', {})
                    full_image_data_url = image_url_info.get('url', '')
                    if full_image_data_url.startswith('data:image/'):
                        header, base64_data = full_image_data_url.split(',', 1)
                        mime_type = header.split(';')[0].split(':')[1]
                        content_for_gemini.append({
                            'inline_data': {
                                'mime_type': mime_type,
                                'data': base64_data
                            }
                        })
                    else:
                        content_for_gemini.append({"text": f"[Image URL: {full_image_data_url}]"})
                elif part.get('type') == 'file_url':
                    file_url_data = part.get('file_url', {}).get('url', '')
                    content_for_gemini.append({"text": f"[File URL: {file_url_data}]"})
        if content_for_gemini:
            gemini_formatted_history.append({
                'role': role,
                'parts': content_for_gemini
            })
    return gemini_formatted_history


@csrf_exempt
def interface_stream(request):
    # --- CHANGED ---
    # 1. Get the user's API key from the request 'Authorization' header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return JsonResponse(
            {"error": "Authorization header with Bearer token is required."},
            status=401
        )
    user_api_key = auth_header.split(' ')[1]

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON in request body"}, status=400)

    messages_history = data.get('messages')
    conversation_name = data.get('conversation_name')

    if not messages_history:
        return JsonResponse({"error": "No messages provided"}, status=400)

    prompt_summary_for_db = extract_prompt_summary(messages_history)

    def event_stream():
        full_response_text = ""
        last_heartbeat = time.time()
        yield sse_comment()

        try:
            # --- CHANGED ---
            # 2. Configure the genai library and create the model with the user's key
            #    This is done inside the request to be specific to this user.
            genai.configure(api_key=user_api_key)
            gemini_flash_model = genai.GenerativeModel(
                'gemini-2.5-flash',
                tools=[internet_search_tool]
            )
            
            if Aiselected_Model == "Gemini-Flash":
                gemini_history = convert_to_gemini_history(messages_history)
                
                # Use the newly created model instance
                response = gemini_flash_model.generate_content(gemini_history)
                
                candidate = response.candidates[0]
                # ... (The rest of your tool-calling and response streaming logic remains the same) ...
                if candidate.content.parts and candidate.content.parts[0].function_call:
                    function_call = candidate.content.parts[0].function_call
                    tool_name = function_call.name
                    tool_args = {key: value for key, value in function_call.args.items()}
                    
                    yield sse_event({"type": "tool_call", "name": tool_name, "args": tool_args})
                    last_heartbeat = time.time()

                    if tool_name in AVAILABLE_TOOLS:
                        try:
                            tool_function = AVAILABLE_TOOLS[tool_name]
                            tool_output = tool_function(**tool_args)
                            print("--- TAVILY API RESPONSE ---", tool_output)

                            if isinstance(tool_output, dict) and "error" in tool_output:
                                raise Exception(tool_output["error"])
                        except Exception as tool_e:
                            error_text = f"An error occurred while using the search tool: {str(tool_e)}"
                            full_response_text += error_text
                            yield sse_event({"type": "delta", "text": error_text})
                            return
                        
                        model_tool_request = candidate.content
                        
                        tool_response = {
                            'role': 'tool',
                            'parts': [{
                                'function_response': {
                                    'name': tool_name,
                                    'response': tool_output,
                                }
                            }]
                        }
                        
                        updated_history = gemini_history + [model_tool_request, tool_response]
                        
                        final_response_stream = gemini_flash_model.generate_content(
                            updated_history, 
                            stream=True
                        )
                        
                        for chunk in final_response_stream:
                            if chunk.text:
                                full_response_text += chunk.text
                                yield sse_event({"type": "delta", "text": chunk.text})
                                last_heartbeat = time.time()
                    else:
                        error_text = f"Error: Model tried to call an unknown function '{tool_name}'."
                        full_response_text += error_text
                        yield sse_event({"type": "delta", "text": error_text})

                else:
                    if response.text:
                        full_response_text += response.text
                        yield sse_event({"type": "delta", "text": response.text})
                        last_heartbeat = time.time()

        except Exception as e:
            # This will now catch errors like an invalid API key from the user
            yield sse_event({"type": "error", "message": str(e)})
        finally:
            try:
                if prompt_summary_for_db and full_response_text:
                    Chat.objects.create(
                        prompt=prompt_summary_for_db,
                        result=full_response_text,
                        conversation_name=conversation_name
                    )
            except Exception as db_e:
                yield sse_event({"type": "error", "message": f"DB save failed: {str(db_e)}"})
            
            yield sse_event({"type": "done"})
            yield sse_comment()

    return StreamingHttpResponse(event_stream(), content_type="text/event-stream")

# ... (The paginated_history and conversation_by_name functions do not need any changes) ...
def paginated_history(request):
    chat_list = Chat.objects.order_by('-date_time').all()

    page_number = request.GET.get('page', 1)
    items_per_page = request.GET.get('limit', 20) 

    paginator = Paginator(chat_list, items_per_page)

    try:
        page_obj = paginator.page(page_number)
    except Exception:
        return JsonResponse({"error": "Page not found"}, status=404)

    formatted_history = [
        {
            "id": chat.id,
            "prompt": chat.prompt,
            "result": chat.result,
            "date_time": chat.date_time.isoformat(),
            "conversation_name": chat.conversation_name,
        } for chat in page_obj
    ]

    return JsonResponse({
        "total_items": paginator.count,
        "total_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
        "results": formatted_history
    }, status=200)

def conversation_by_name(request,conversation_name):
    if not Chat.objects.filter(conversation_name=conversation_name).exists():
        return JsonResponse({"error": "Conversation not found"}, status=404)

    conversation_chats = Chat.objects.filter(
        conversation_name=conversation_name
    ).order_by('date_time')

    formatted_messages = [
        {
            "id": chat.id,
            "prompt": chat.prompt,
            "result": chat.result,
            "date_time": chat.date_time.isoformat(),
            "conversation_name": chat.conversation_name,
        } for chat in conversation_chats
    ]
    return JsonResponse({
        "id": conversation_name,
        "messages": formatted_messages,
        "last_message_time": formatted_messages[-1]["date_time"] if formatted_messages else ""
    }, status=200)