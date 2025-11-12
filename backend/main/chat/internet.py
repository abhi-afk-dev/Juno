import requests
from bs4 import BeautifulSoup
import json
import time
from typing import List, Dict, Any


# TARGET_URL = 'https://en.wikipedia.org/wiki/{user_search}'

YOUR_API_ENDPOINT = 'https://httpbin.org/post' 


def get_page_content(url: str) -> str:
        
    print(f"1. Fetching content from: {url}")
    
    try:
        headers = {'User-Agent': 'Apple'}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching page: {e}")
        return ""

    soup = BeautifulSoup(response.text, 'html.parser')
    
    main_content_div = soup.find('div', id='content') or soup.find('main') or soup.body

    if not main_content_div:
        print("Warning: Could not identify a main content area. Scraping the whole body.")
        main_content_div = soup.body
        
    compiled_text = []
    
    for tag in main_content_div.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p']):
        text = tag.get_text(strip=True)
        if text:
            if tag.name.startswith('h'):
                compiled_text.append(f"\n\n--- {tag.name.upper()}: {text} ---")
            else:
                compiled_text.append(text)
                
    final_content = ' '.join(compiled_text)
    
    if len(final_content) > 50:
        print(f"   Successfully scraped {len(final_content)} characters of general content.")
    else:
        print("Warning: Scraped very little content. Check the target URL.")
        
    return final_content


# def send_data_to_api(endpoint: str, content: str) -> Dict[str, Any]:
#     payload = {
#         "timestamp": int(time.time()),
#         "source_url": TARGET_URL,
#         "content_length": len(content),
#         "text_content": content
#     }
    
#     print(f"\n2. Sending content (Length: {len(content)}) to API endpoint: {endpoint}")
    
#     try:
#         api_response = requests.post(
#             endpoint,
#             json=payload,
#             timeout=100,
#             headers={'Content-Type': 'application/json'}
#         )
        
#         api_response.raise_for_status()
        
#         print("   API request successful! Status Code:", api_response.status_code)
        
#         return api_response.json()
            
#     except requests.exceptions.RequestException as e:
#         print(f"Error sending data to API: {e}")
#         return {"error": str(e), "status_code": getattr(e.response, 'status_code', 'N/A')}



if __name__ == "__main__":
    
    user_search=input("Enter your wiki query: ")

    TARGET_URL = f'https://en.wikipedia.org/wiki/{user_search}' 
    # if not full_page_content:
    #     print("\nProcess aborted: Failed to scrape content.")
    # else:
    full_page_content = get_page_content(TARGET_URL)
    print(full_page_content[:400] + "...")
    print("-" * 35)
    # api_result = send_data_to_api(YOUR_API_ENDPOINT, full_page_content)
    # print(json.dumps(api_result, indent=2))
    print("---------------------------------------------------")
