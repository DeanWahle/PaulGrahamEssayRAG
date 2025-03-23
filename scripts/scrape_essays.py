import requests
from bs4 import BeautifulSoup
import re
import json
import os
import time
from dotenv import load_dotenv
from openai import OpenAI
import pathlib

# Load environment variables
load_dotenv()

# Get script directory and project root
SCRIPT_DIR = pathlib.Path(__file__).parent.absolute()
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

# Initialize the client (simplified)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Fetch the articles page


def get_essay_links():
    print("Fetching essay links...")
    response = requests.get("https://paulgraham.com/articles.html")
    soup = BeautifulSoup(response.text, 'html.parser')

    links = []
    for a in soup.find_all('a'):
        href = a.get('href')
        if href and href.endswith('.html') and href != 'articles.html':
            # Create full URL if needed
            if not href.startswith('http'):
                href = f"https://paulgraham.com/{href}"
            links.append({
                'url': href,
                'title': a.text.strip()
            })

    print(f"Found {len(links)} essays")
    return links

# Scrape a single essay


def scrape_essay(url, title):
    print(f"Scraping: {title} - {url}")
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Most essays have the content in a table cell or main body
    content = ""

    # Try to find the main content
    main_content = soup.find('table') or soup.find('body')
    if main_content:
        content = main_content.get_text()

    # Clean the content
    content = re.sub(r'\s+', ' ', content).strip()

    # Basic metadata extraction
    date_match = re.search(r'([A-Z][a-z]+ \d{4})', content)
    date = date_match.group(1) if date_match else "Unknown"

    # Special handling for index.html
    if url.endswith('index.html') and (not title or title.strip() == ""):
        # For index page, use "Home Page" or extract from page
        title = "Paul Graham's Essays (Home Page)"

        # Try to extract a better title if possible
        page_title = soup.find('title')
        if page_title and page_title.text:
            title = page_title.text.strip()

    return {
        'title': title,
        'url': url,
        'content': content,
        'date': date
    }

# Generate embeddings using the latest model


def generate_embedding(text):
    truncated_text = text[:8000]  # Limit for token count

    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",  # Using the newer model
            input=truncated_text,
            dimensions=1536  # Optional: control vector size
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None

# Save essays to a JSON file


def save_essays_to_json(essays):
    print("Saving essays to JSON file...")

    # Strip embeddings for cleaner JSON (they're large)
    essays_without_embeddings = []
    for essay in essays:
        essay_copy = essay.copy()
        if 'embedding' in essay_copy:
            del essay_copy['embedding']
        essays_without_embeddings.append(essay_copy)

    # Use the absolute path
    output_file = os.path.join(DATA_DIR, "essays.json")
    with open(output_file, 'w') as f:
        json.dump(essays_without_embeddings, f, indent=2)

    print(f"Saved {len(essays)} essays to {output_file}")

# Main function


def main():
    print("Starting Paul Graham essay scraper...")

    # Create data directory if it doesn't exist
    os.makedirs(DATA_DIR, exist_ok=True)

    # Get all essay links
    essay_links = get_essay_links()

    # Scrape and process each essay (limiting to 3 for initial testing)
    essays = []
    for link in essay_links:  # Process all essays
        essay = scrape_essay(link['url'], link['title'])

        # Generate embedding if API key is available
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and api_key not in (None, "", "YOUR_ACTUAL_API_KEY"):
            print(f"Generating embedding for: {essay['title']}")
            embedding = generate_embedding(essay['content'])
            if embedding:
                essay['embedding'] = embedding
                print(
                    f"Embedding generated successfully for: {essay['title']}")
        else:
            print("Skipping embedding generation (no valid API key found)")

        essays.append(essay)
        time.sleep(1)  # Be nice to the server

    # Save essays to JSON file
    save_essays_to_json(essays)
    print("Scraping complete!")


if __name__ == "__main__":
    main()
