# tools.py

import google.generativeai as genai
# REMOVE: import os
from tavily import TavilyClient

# The function now takes the key as an argument
def internet_search(query: str, tavily_api_key: str):
    """Searches the internet for information on a given query."""
    try:
        # Use the key passed as an argument, NOT from the environment
        tavily_client = TavilyClient(api_key=tavily_api_key)

        # ... the rest of your function remains the same ...
        search_queries = [
            query,
            f"what is {query}",
            f"{query} company information",
            f"{query} overview",
        ]
        # ... etc.

        all_results = []
        for q in search_queries:
            response = tavily_client.search(query=q, search_depth="basic")
            if response.get('results'):
                all_results.extend(response['results'])
            if len(all_results) > 5:
                break
        
        if not all_results:
            return {"results": "No relevant information found."}

        return {"results": all_results}
    
    except Exception as e:
        return {"error": f"Failed to perform internet search. Details: {str(e)}"}


AVAILABLE_TOOLS = {
    "internet_search": internet_search,
}
internet_search_tool = genai.protos.Tool(
    function_declarations=[
        genai.protos.FunctionDeclaration(
            name='internet_search',
            description="Searches the internet for real-time, up-to-date information on any topic. Use this for questions about current events, facts, or anything that requires fresh data.",
            parameters=genai.protos.Schema(
                type=genai.protos.Type.OBJECT,
                properties={
                    'query': genai.protos.Schema(
                        type=genai.protos.Type.STRING, 
                        description="The specific search query or question to look up on the internet."
                    ),
                },
                required=['query']
            )
        )
    ]
)