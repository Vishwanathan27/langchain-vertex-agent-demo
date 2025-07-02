// Main chat UI for SwarnaAI gold/silver assistant
import React, { useState, useRef, useEffect } from 'react';
import { sendAIMessage } from './api/ai';
import ChatBubble from '../components/ChatBubble';

export default function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll to bottom of chat when new message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle sending message to AI
  const handleSend = async () => {
    if (!input.trim()) return; // Ignore empty input
    const userMsg = { sender: 'user', text: input, timestamp: new Date().toLocaleTimeString() };
    setMessages((msgs) => [...msgs, userMsg]); // Add user message to chat
    setInput(''); // Clear input field
    setLoading(true); // Show loading indicator
    try {
      const aiResp = await sendAIMessage(input); // Send message to AI API
      setMessages((msgs) => [
        ...msgs,
        { sender: 'ai', text: aiResp, timestamp: new Date().toLocaleTimeString() },
      ]); // Add AI response to chat
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { sender: 'ai', text: 'Error: Could not get response.', timestamp: new Date().toLocaleTimeString() },
      ]); // Handle API error
    }
    setLoading(false); // Hide loading indicator
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white border rounded shadow p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">SwarnaAI Gold/Silver Chatbot</h1>
      <div className="h-64 overflow-y-auto border rounded p-2 mb-4 bg-gray-50">
        {messages.map((msg, i) => (
          <ChatBubble key={i} {...msg} />
        ))}
        {loading && <div className="text-gray-400">SwarnaAI is typing...</div>}
        <div ref={chatEndRef} /> {/* Scroll target */}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2 focus:outline-none"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about gold, silver, trends..."
          disabled={loading}
        />
        <button
          className="bg-yellow-500 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
