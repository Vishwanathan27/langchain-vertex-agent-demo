// ChatBubble component for user/AI messages in SwarnaAI
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
    </div>
  </div>
);

export default ChatBubble;
