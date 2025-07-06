// ChatBubble component for user/AI messages in SwarnaAI
import React from 'react';

interface ChatBubbleProps {
  message: string;
  sender: 'user' | 'ai';
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, sender }) => (
  <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
    <div
      className={`rounded-lg px-4 py-2 ${
        sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
      }`}
    >
      {message}
    </div>
  </div>
);

export default ChatBubble;
