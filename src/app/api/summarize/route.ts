import { NextResponse } from 'next/server';
import openai from '@/utils/openai';

// Define the Essay type
type Essay = {
  id: number;
  title: string;
  url: string;
  content: string;
  similarity: number;
  refIndex?: number; // Optional index for references
};

export async function POST(request: Request) {
  try {
    const { essays, query } = await request.json();
    
    if (!essays || !essays.length) {
      return NextResponse.json({ error: 'No essays provided' }, { status: 400 });
    }

    // Create a numbered mapping of essays for references
    const essaysWithIndex = essays.slice(0, 5).map((essay: Essay, index: number) => ({
      ...essay,
      refIndex: index + 1
    }));

    // Format the essay content for the prompt
    const essayContext = essaysWithIndex.map((essay: Essay) => 
      `Essay ${essay.refIndex}: "${essay.title}" (${essay.url})\n${essay.content.substring(0, 800)}...\n\n`
    ).join('');

    // Create a prompt requesting a response with numbered citations
    const prompt = `
      Based on the following essays by Paul Graham, answer this question: "${query}"
      
      ${essayContext}
      
      Format your response as follows:
      1. Use numbered citations like [1], [2], etc. when referencing specific essays
      2. Make your response insightful and comprehensive, focusing on the key points from each essay
      3. Bold important concepts or terms using **term** markdown syntax
      4. Include specific examples from the essays when relevant
      5. Aim for 2-3 paragraphs in total
      6. End with a one-sentence summary that captures the essence of the answer
      
      Your response should show depth and understanding while remaining clear and easy to follow.
    `;

    // Generate a summary using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500, // Increased token limit for more comprehensive responses
    });

    const summary = completion.choices[0].message.content;

    // Generate references section
    const references = essaysWithIndex.map((essay: Essay) => 
      `[${essay.refIndex}] "${essay.title}"`
    ).join('\n\n');

    return NextResponse.json({ summary, references });
  } catch (error) {
    console.error('Error in summarize API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 