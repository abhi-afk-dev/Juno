import google.generativeai as genai
import os
from tavily import TavilyClient

def internet_search(query: str):
    try:
        tavily_client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

        search_queries = [
            query,
            f"what is {query}",
            f"{query} company information",
            f"{query} overview",
        ]

        all_results = []
        for q in search_queries:
            response = tavily_client.search(query=q, search_depth="basic")
            if response.get('results'):
                all_results.extend(response['results'])
            if len(all_results) > 5:
                break
        
        if not all_results:
            return {"results": "No relevant information found on the internet after several attempts."}

        return {"results": all_results}
    
    except Exception as e:
        return {"error": "Failed to perform internet search."}

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