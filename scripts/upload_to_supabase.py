import json
import os
import pathlib
import time
from openai import OpenAI
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Get script directory and project root
SCRIPT_DIR = pathlib.Path(__file__).parent.absolute()
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = os.path.join(PROJECT_ROOT, "data")

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)


def load_essays_from_json():
    """Load the scraped essays from the JSON file."""
    json_path = os.path.join(DATA_DIR, "essays.json")

    if not os.path.exists(json_path):
        raise FileNotFoundError(
            f"Essay data not found at {json_path}. Run scrape_essays.py first.")

    with open(json_path, 'r') as f:
        essays = json.load(f)

    print(f"Loaded {len(essays)} essays from {json_path}")
    return essays


def generate_embedding(text):
    """Generate a vector embedding for text using OpenAI's API."""
    truncated_text = text[:8000]  # Limit text to avoid token limits

    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=truncated_text,
            dimensions=1536
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return None


def upload_essays(essays):
    """Upload essays to Supabase with embeddings."""

    # Process each essay
    for essay in essays:
        title = essay.get('title', '')
        url = essay.get('url', '')
        content = essay.get('content', '')
        date = essay.get('date', 'Unknown')

        # Generate embedding
        print(f"Generating embedding for: {title}")
        embedding = generate_embedding(content)

        # Prepare data
        essay_data = {
            "title": title,
            "url": url,
            "content": content,
            "date": date
        }

        # Add embedding if available
        if embedding:
            essay_data["embedding"] = embedding

        # Insert or update essay in Supabase
        try:
            # First check if the essay already exists
            result = supabase.table("essays").select(
                "id").eq("url", url).execute()

            if result.data and len(result.data) > 0:
                # Essay exists, update it
                essay_id = result.data[0]["id"]
                supabase.table("essays").update(
                    essay_data).eq("id", essay_id).execute()
                print(f"Updated essay: {title}")
            else:
                # Essay doesn't exist, insert it
                supabase.table("essays").insert(essay_data).execute()
                print(f"Inserted new essay: {title}")

            # Be nice to OpenAI API
            time.sleep(0.5)

        except Exception as e:
            print(f"Error uploading essay {title}: {e}")

    print(f"Successfully uploaded {len(essays)} essays to Supabase")


def main():
    """Main function to load and upload essays to Supabase."""
    print("Starting essay upload to Supabase...")

    try:
        # Check Supabase connection
        print(f"Connecting to Supabase at: {supabase_url}")

        # Simple test query to make sure we can connect - using a different approach
        test = supabase.table("essays").select("*").execute()
        count = len(test.data) if hasattr(test, 'data') else 0
        print(
            f"Connected to Supabase successfully. Found {count} existing essays.")

        # Load essays
        essays = load_essays_from_json()

        # Upload essays
        upload_essays(essays)

        print("Upload complete!")

    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    main()
