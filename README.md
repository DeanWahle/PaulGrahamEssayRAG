# Paul Graham Essay Explorer

A Next.js application that uses Retrieval Augmented Generation (RAG) to answer questions about Paul Graham's essays. The app retrieves relevant essays from a vector database and generates concise answers using OpenAI.

## Features

- 💬 **Chat Interface**: Ask questions about Paul Graham's essays in a simple chat UI
- 🔍 **Semantic Search**: Finds the most relevant essays using embeddings and vector similarity
- 🤖 **AI-Powered Summaries**: Generates concise, accurate answers using GPT-4
- 🔗 **Source Links**: Provides links to the original essays
- 📊 **Evaluation Framework**: Comprehensive toolkit for benchmarking system performance

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API routes
- **Vector Database**: Supabase PostgreSQL with pgvector extension
- **AI**: OpenAI for embeddings (text-embedding-3-small) and text generation (GPT-4 Turbo)
- **Markdown**: Marked.js for rendering markdown in responses

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Supabase account with a project that has the pgvector extension enabled
- Docker and Docker Compose (optional, for local development)

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### Installation

1. Clone the repository

```bash
git clone https://github.com/DeanWahle/PaulGrahamEssayRAG.git
cd PaulGrahamEssayRAG
```

2. Install dependencies

```bash
npm install
```

3. Run the development server

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Data Preparation

The project includes scripts to collect and prepare Paul Graham's essays:

1. **Scraping**: `scripts/scrape_essays.py` scrapes Paul Graham's essays from his website
2. **Embedding**: The script also generates embeddings for each essay using OpenAI
3. **Database Upload**: `scripts/upload_to_supabase.py` uploads the essays with their embeddings to Supabase

To run the data preparation scripts:

```bash
# Create a virtual environment for the scripts
cd scripts
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run the scripts
python scrape_essays.py
python upload_to_supabase.py
```

## Evaluation Framework

The project includes a comprehensive evaluation toolkit to benchmark the quality of the RAG system's responses:

### Features

- Predefined set of questions with expert-written "golden" answers
- Automated evaluation using GPT-4
- Interactive human evaluation option
- Detailed metrics including relevance, accuracy, completeness, and citation quality
- Comprehensive reporting and statistics

### Running Evaluations

```bash
# Install evaluation dependencies
cd eval
npm install

# Run automated evaluation with GPT-4
npm run eval:auto

# Run interactive human evaluation
npm run human
```

See the [evaluation README](./eval/README.md) for more details.

## Database Setup

### Using Supabase Cloud

The application requires a Supabase database with the following:

1. A table called `essays` with the following schema:

   - `id`: integer (primary key)
   - `title`: text
   - `url`: text
   - `content`: text
   - `embedding`: vector(1536) (for text-embedding-3-small)

2. A stored function called `match_essays` for similarity search:

```sql
create or replace function match_essays(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
) returns table (
  id bigint,
  title text,
  url text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    title,
    url,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from essays
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
```

### Using Docker for Local Development

This project includes Docker configuration for local development with Supabase PostgreSQL:

1. Start the Docker container:

```bash
docker-compose up -d
```

2. The container will automatically:

   - Set up PostgreSQL with the pgvector extension
   - Create the essays table with the correct schema
   - Set up the vector similarity search function

3. To load data into the local database, use the scripts:

```bash
# Make sure you're in the scripts directory with the virtual environment activated
python upload_to_supabase.py
```

4. Update your `.env.local` to use the local database:

```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:5432
NEXT_PUBLIC_SUPABASE_ANON_KEY=postgres
OPENAI_API_KEY=your_openai_api_key
```

5. To reset the database and start fresh:

```bash
# From the project root
./scripts/restart_and_load.sh
```

## Deployment

This project can be deployed on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDeanWahle%2FPaulGrahamEssayRAG)

Remember to set up your environment variables in the Vercel dashboard.

## License

MIT

## Acknowledgements

- [Paul Graham](http://www.paulgraham.com/) for his insightful essays
- [OpenAI](https://openai.com/) for their powerful AI models
- [Supabase](https://supabase.com/) for vector search capabilities
