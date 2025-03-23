"use client";

import { useState } from 'react';
import { useChat } from '@/hooks/useChat';

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-12">
      <div className="z-10 w-full max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Paul Graham Essay Explorer
        </h1>
        
        <div className="bg-white/10 p-6 rounded-lg shadow-md mb-8">
          <div className="space-y-6 mb-6 max-h-[70vh] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                Ask a question about Paul Graham&apos;s essays
              </div>
            ) : (
              messages.map((message, i) => (
                <div key={i} className="flex w-full">
                  <div 
                    className={`rounded-lg p-4 ${
                      message.role === 'user' 
                        ? 'bg-blue-500/10 ml-auto' 
                        : 'bg-gray-500/10 mr-auto'
                    } ${
                      message.role === 'user'
                        ? 'ml-auto text-right' 
                        : 'mr-auto text-left'
                    } ${
                      // For assistant messages with rich content (contains "response-container"), 
                      // or long user messages, use the 2/3 width
                      (message.role === 'assistant' && message.content.includes('response-container')) || 
                      (message.role === 'user' && message.content.length > 100)
                        ? 'w-2/3' 
                        : 'max-w-2/3' // Otherwise let it be as wide as content (with max-width)
                    }`}
                  >
                    <div 
                      className={`${message.role === 'assistant' ? 'prose prose-sm max-w-none' : ''}`}
                      dangerouslySetInnerHTML={{ __html: message.content }} 
                    />
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex w-full">
                <div className="p-4 rounded-lg bg-gray-500/10 mr-auto">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about Paul Graham's essays..."
              className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input}
              className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
} 