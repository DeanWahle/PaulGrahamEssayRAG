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

// Increase the Next.js API route timeout
export const runtime = 'edge'; // Use edge runtime for better performance and longer timeout

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

    // Reduce content size to minimize token usage
    const essayContext = essaysWithIndex.map((essay: Essay) => 
      `Essay ${essay.refIndex}: "${essay.title}" (${essay.url})\n${essay.content.substring(0, 500)}...\n\n`
    ).join('');

    // Create a prompt requesting a response with numbered citations
    const prompt = `
      Based on the following essays by Paul Graham, answer this question: "${query}"
      
      ${essayContext}
      
      Format your response as follows:
      1. Use numbered citations like [1], [2], etc. when referencing specific essays
      2. Make your response focused and concise
      3. Bold important concepts or terms using **term** markdown syntax
      4. Include specific examples from the essays when relevant
      5. Aim for 1-2 paragraphs in total
      6. End with a one-sentence summary that captures the essence of the answer
      
      Your response should show understanding while remaining clear and easy to follow.
    `;

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('OpenAI API timeout')), 25000); // 25 second timeout
    });

    // Generate a summary using OpenAI with timeout
    const completionPromise = openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 350, // Reduced token limit to speed up response
    });

    // Race the completion against the timeout
    const completion = await Promise.race([completionPromise, timeoutPromise]) as any;
    const summary = completion.choices[0].message.content;

    // Generate references section
    const references = essaysWithIndex.map((essay: Essay) => 
      `[${essay.refIndex}] "${essay.title}"`
    ).join('\n\n');

    return NextResponse.json({ summary, references });
  } catch (error) {
    console.error('Error in summarize API:', error);
    
    // Provide a fallback response on timeout or error
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    if (errorMessage.includes('timeout')) {
      return NextResponse.json({ 
        summary: "I apologize, but the response took too long to generate. Please try again with a more specific question or try later.",
        references: "Response timed out",
        error: errorMessage
      }, { status: 200 }); // Return 200 instead of error to handle gracefully on frontend
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 