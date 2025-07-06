import React, { useState, useRef, useEffect } from 'react';
import { sendAIMessage } from '../api/ai';
import ChatBubble from '../../components/ChatBubble';

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage: Message = { text: input, sender: 'user' };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setLoading(true);

    try {
      const chat_history = messages.map((msg) => {
        return {
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        };
      });

      const aiResponse = await sendAIMessage(input, chat_history);
      const aiMessage: Message = { text: aiResponse, sender: 'ai' };
      setMessages([...currentMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        text: 'Sorry, something went wrong.',
        sender: 'ai',
      };
      setMessages([...currentMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-96">
      <div className="flex-grow p-4 overflow-y-auto border rounded mb-4 bg-gray-50">
        {messages.map((msg, index) => (
          <ChatBubble key={index} message={msg.text} sender={msg.sender} />
        ))}
        {loading && <div className="text-gray-400">SwarnaAI is typing...</div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about gold, silver, trends..."
          disabled={loading}
        />
        <button
          onClick={handleSend}
          className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
