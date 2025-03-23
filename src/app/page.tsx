"use client";

import { useState } from 'react';
import { useChat } from '@/hooks/useChat';

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="z-10 w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Paul Graham Essay Explorer
        </h1>
        
        <div className="bg-white/10 p-6 rounded-lg shadow-md mb-8">
          <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400">
                Ask a question about Paul Graham&apos;s essays
              </div>
            ) : (
              messages.map((message, i) => (
                <div 
                  key={i} 
                  className={`p-4 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-500/10 ml-auto text-right' 
                      : 'bg-gray-500/10 text-left'
                  } ${message.role === 'user' ? 'ml-auto max-w-[80%]' : 'mr-auto w-full'}`}
                >
                  <div 
                    className={`${message.role === 'assistant' ? 'prose prose-sm max-w-none' : ''}`}
                    dangerouslySetInnerHTML={{ __html: message.content }} 
                  />
                </div>
              ))
            )}
            {isLoading && (
              <div className="p-4 rounded-lg bg-gray-500/10 max-w-[80%]">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
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
              className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
} 