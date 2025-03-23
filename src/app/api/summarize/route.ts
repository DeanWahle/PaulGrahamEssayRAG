import { NextResponse } from 'next/server';
import openai from '@/utils/openai';

export async function POST(request: Request) {
  try {
    const { essays, query } = await request.json();
    
    if (!essays || !essays.length) {
      return NextResponse.json({ error: 'No essays provided' }, { status: 400 });
    }

    // Format the essay content for the prompt
    const essayContext = essays.map((essay, index) => 
      `Essay ${index + 1}: "${essay.title}" (${essay.url})\n${essay.content.substring(0, 800)}...\n\n`
    ).join('');

    // Create a prompt requesting a concise response
    const prompt = `
      Based on the following essays by Paul Graham, answer this question in 2-3 sentences: "${query}"
      
      ${essayContext}
      
      Keep your response very brief, direct, and to the point. Focus only on the most essential insights from the essays that address the query.
    `;

    // Generate a summary using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 150, // Reduced token limit for shorter responses
    });

    const summary = completion.choices[0].message.content;

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error in summarize API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 