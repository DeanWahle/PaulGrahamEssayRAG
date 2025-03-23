import { useState } from 'react';
import { marked } from 'marked';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Add essay type definition
type Essay = {
  id: number;
  title: string;
  url: string;
  content: string;
  similarity: number;
};

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    try {
      // Step 1: Search for relevant essays
      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.content }),
      });

      if (!searchResponse.ok) {
        throw new Error('Search request failed');
      }

      const { essays } = await searchResponse.json();

      // Step 2: Generate summary if essays found
      if (essays && essays.length > 0) {
        // Format essay links for display
        const essayLinks = essays.map((essay: Essay) => 
          `<a href="${essay.url}" target="_blank" rel="noopener noreferrer">${essay.title}</a> (similarity: ${essay.similarity.toFixed(2)})`
        ).join('<br>');

        // Generate AI summary
        const summaryResponse = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ essays, query: userMessage.content }),
        });

        if (!summaryResponse.ok) {
          throw new Error('Summary request failed');
        }

        const { summary } = await summaryResponse.json();

        // Format the complete response with just the parsed summary
        const formattedResponse = `${marked.parse(summary)}`;

        // Add assistant message to chat
        setMessages((prev) => [
          ...prev, 
          { role: 'assistant', content: formattedResponse }
        ]);
      } else {
        setMessages((prev) => [
          ...prev, 
          { 
            role: 'assistant', 
            content: "I couldn't find any relevant essays that answer your question. Could you try rephrasing or asking about a different topic?" 
          }
        ]);
      }
    } catch (error) {
      console.error('Error processing request:', error);
      setMessages((prev) => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "I encountered an error while processing your request. Please try again." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, input, handleInputChange, handleSubmit, isLoading };
}
