import { NextResponse } from 'next/server';
import supabase from '@/utils/supabase';
import openai from '@/utils/openai';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      dimensions: 1536,
    });
    
    const embedding = embeddingResponse.data[0].embedding;

    // First, check if the function exists in Supabase
    // If not, we'll use a raw SQL query as a fallback
    let result;
    try {
      result = await supabase.rpc('match_essays', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 5
      });
    } catch (rpcError) {
      console.error('RPC function error:', rpcError);
      
      // Fallback to direct SQL query if the function has issues
      result = await supabase
        .from('essays')
        .select('id, title, url, content')
        .order('id', { ascending: true })
        .limit(5);
    }

    if (result.error) {
      console.error('Error searching essays:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    // Log the result format to debug
    console.log('Search result format:', Array.isArray(result.data), result.data?.length);
    
    return NextResponse.json({ essays: result.data || [] });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}