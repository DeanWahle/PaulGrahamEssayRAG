-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the essays table with vector support
CREATE TABLE IF NOT EXISTS essays (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    date TEXT,
    embedding vector(1536)
);

-- Create an index for faster vector similarity searches
CREATE INDEX IF NOT EXISTS essays_embedding_idx ON essays USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create a function for similarity search
CREATE OR REPLACE FUNCTION match_essays(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id int,
  title text,
  url text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    essays.id,
    essays.title,
    essays.url,
    essays.content,
    1 - (essays.embedding <=> query_embedding) AS similarity
  FROM essays
  WHERE 1 - (essays.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$; 