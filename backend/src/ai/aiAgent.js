// SwarnaAI conversational agent using LangChain, Vertex AI, and DynamicTool
const { ChatVertexAI } = require('@langchain/google-vertexai');
const { initializeAgentExecutorWithOptions } = require('langchain/agents');
const { BufferMemory, ChatMessageHistory } = require('langchain/memory');
const { DynamicTool } = require('langchain/tools');
const axios = require('axios');
const path = require('path');
const { loadCredentials } = require('../utils/googleCreds');
const chrono = require('chrono-node');

const SYSTEM_PROMPT = `You are SwarnaAI — a polite, market-savvy assistant that helps Indian users understand gold and silver market trends. Always explain clearly, give real-world comparisons, and advise users to do their own research.\n\nYou can answer questions like: 'Compare gold price today vs last week', 'How much did gold change in the past 30 days?', 'Gold price difference between today and May 1, 2024', or 'What was the gold price yesterday compared to now?'.\n\nNote: This is an AI-generated market insight. Always consult a financial advisor before making investment decisions.`;

const GOLD_API_BASE = process.env.GOLD_API_BASE || 'https://www.goldapi.io/api';

function createVertexModel(authClient) {
  return new ChatVertexAI({
    temperature: 0.2,
    model: process.env.MODEL,
    project: process.env.PROJECT_ID,
    location: process.env.LOCATION,
    credentials: loadCredentials(),
    systemMessage: SYSTEM_PROMPT,
    authClient,
  });
}

function createTools() {
  const GOLD_API_KEY = process.env.GOLD_API_KEY;
  return [
    new DynamicTool({
      name: 'getCurrentPrice',
      description: 'Returns the latest gold and silver prices in INR for India.',
      func: async (_input) => {
        try {
          const res = await fetch(`${GOLD_API_BASE}/XAU/INR`, {
            method: 'GET',
            headers: {
              'x-access-token': GOLD_API_KEY,
              'Content-Type': 'application/json',
            },
            redirect: 'follow',
          });
          const data = await res.json();
          return JSON.stringify(data);
        } catch (err) {
          return 'Could not fetch current price.';
        }
      },
    }),
    new DynamicTool({
      name: 'getHistoricalComparison',
      description: 'Returns gold price change in INR and percent over a natural language period (e.g., "last week", "past 30 days", "yesterday", or between two dates).',
      func: async (input) => {
        try {
          // Parse input for dates using chrono-node
          let dates = chrono.parse(input);
          let today = new Date();
          let prev = new Date();
          if (dates.length === 2) {
            prev = dates[0].start.date();
            today = dates[1].start.date();
          } else if (dates.length === 1) {
            prev = dates[0].start.date();
          } else {
            // fallback: try to extract days
            const days = parseInt(input.match(/\d+/)?.[0], 10) || 7;
            prev.setDate(today.getDate() - days);
          }
          const format = d => d.toISOString().slice(0, 10).replace(/-/g, '');
          const todayStr = format(today);
          const prevStr = format(prev);
          // Fetch both days
          const [resPrev, resToday] = await Promise.all([
            fetch(`${GOLD_API_BASE}/XAU/INR/${prevStr}`, {
              method: 'GET',
              headers: {
                'x-access-token': GOLD_API_KEY,
                'Content-Type': 'application/json',
              },
              redirect: 'follow',
            }),
            fetch(`${GOLD_API_BASE}/XAU/INR/${todayStr}`, {
              method: 'GET',
              headers: {
                'x-access-token': GOLD_API_KEY,
                'Content-Type': 'application/json',
              },
              redirect: 'follow',
            })
          ]);
          const prevData = await resPrev.json();
          const todayData = await resToday.json();
          if (!prevData.price || !todayData.price) return 'Not enough data.';
          const goldDiff = todayData.price - prevData.price;
          const goldPct = ((goldDiff / prevData.price) * 100).toFixed(2);
          return `Gold: ₹${prevData.price} → ₹${todayData.price} (Change: ₹${goldDiff} / ${goldPct}%)`;
        } catch (err) {
          return 'Could not fetch historical comparison.';
        }
      },
    }),
  ];
}

function createMemory(chat_history = []) {
  const history = new ChatMessageHistory();
  if (Array.isArray(chat_history) && chat_history.length > 0) {
    for (const msg of chat_history) {
      if (msg.sender === 'user') {
        history.addUserMessage(msg.text);
      } else if (msg.sender === 'ai') {
        history.addAIMessage(msg.text);
      }
    }
  }
  return new BufferMemory({
    memoryKey: 'chat_history',
    returnMessages: true,
    chatHistory: history,
  });
}

// Optionally, implement a helper to get GCP auth client if needed
async function getGcpAuthClient() {
  return undefined;
}

async function swarnaAIAgent(input, chatHistory) {
  const authClient = await loadCredentials();
  const model = createVertexModel(authClient);
  const tools = createTools();

  const memory = createMemory(chatHistory);

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: 'chat-conversational-react-description',
    verbose: process.env.LANGCHAIN_VERBOSE === 'true',
    memory,
    agentArgs: {
      systemMessage: SYSTEM_PROMPT,
    },
  });

  const result = await executor.call({
    input: input,
  });

  return result.output;
}

module.exports = { swarnaAIAgent };
