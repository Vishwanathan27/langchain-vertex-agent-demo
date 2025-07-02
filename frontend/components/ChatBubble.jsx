// ChatBubble component for user/AI messages in SwarnaAI
import React from 'react';

export default function ChatBubble({ sender, text, timestamp }) {
  const isUser = sender === 'user';
  return (
    <div className={`mb-2 flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`px-3 py-2 rounded-lg max-w-xs break-words ${isUser ? 'bg-yellow-200' : 'bg-blue-100'}`}>{text}</div>
      <span className="text-xs text-gray-400 mt-1">{timestamp}</span>
    </div>
  );
}
