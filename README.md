# Paul Graham Essay Explorer

A Next.js application that uses Retrieval Augmented Generation (RAG) to answer questions about Paul Graham's essays. The app retrieves relevant essays from a vector database and generates concise answers using OpenAI.

## Features

- 💬 **Chat Interface**: Ask questions about Paul Graham's essays in a simple chat UI
- 🔍 **Semantic Search**: Finds the most relevant essays using embeddings and vector similarity
- 🤖 **AI-Powered Summaries**: Generates concise, accurate answers using GPT-4
- 🔗 **Source Links**: Provides links to the original essays

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

## Database Setup

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
