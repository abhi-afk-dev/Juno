import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Any



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


if __name__ == "__main__":
    
    user_search=input("Enter your wiki query: ")

    TARGET_URL = f'https://en.wikipedia.org/wiki/{user_search}' 
    full_page_content = get_page_content(TARGET_URL)
    print(full_page_content[:400] + "...")
    print("-" * 35)
    print("---------------------------------------------------")
