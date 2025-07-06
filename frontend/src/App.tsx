// Main chat UI for SwarnaAI gold/silver assistant
import React from 'react';
import Chat from './components/Chat';
import './index.css';

export default function App() {
  return (
    <div className="max-w-xl mx-auto mt-10 bg-white border rounded shadow p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">SwarnaAI Gold/Silver Chatbot</h1>
      <Chat />
    </div>
  );
}
