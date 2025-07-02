// SwarnaAI conversational agent using LangChain, Vertex AI, and DynamicTool
const { ChatVertexAI } = require('@langchain/google-vertexai');
const { initializeAgentExecutorWithOptions } = require('langchain/agents');
const { BufferMemory, ChatMessageHistory } = require('langchain/memory');
const { DynamicTool } = require('langchain/tools');
const axios = require('axios');
const path = require('path');

const SYSTEM_PROMPT = `You are SwarnaAI — a polite, market-savvy assistant that helps Indian users understand gold and silver market trends. Always explain clearly, give real-world comparisons, and advise users to do their own research.\n\nNote: This is an AI-generated market insight. Always consult a financial advisor before making investment decisions.`;

function createVertexModel(authClient) {
  return new ChatVertexAI({
    temperature: 0.2,
    model: process.env.MODEL,
    project: process.env.PROJECT_ID,
    location: process.env.LOCATION,
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(process.cwd(), 'service-account.json'),
    systemMessage: SYSTEM_PROMPT,
    authClient,
  });
}

function createTools() {
  return [
    new DynamicTool({
      name: 'getCurrentPrice',
      description: 'Returns the latest gold and silver prices in INR for India.',
      func: async () => {
        try {
          const { data } = await axios.get('http://localhost:3000/api/v1/prices/goldapi');
          return JSON.stringify(data);
        } catch (err) {
          return 'Could not fetch current price.';
        }
      },
    }),
    new DynamicTool({
      name: 'getHistoricalComparison',
      description: 'Returns gold and silver price change in INR and percent over a given number of days.',
      func: async (input) => {
        const days = parseInt(input, 10) || 7;
        try {
          const { data } = await axios.get(`http://localhost:3000/api/v1/prices/history?days=${days}`);
          if (!Array.isArray(data) || data.length < 2) return 'Not enough data.';
          const first = data[0];
          const last = data[data.length - 1];
          const goldDiff = last.goldInr - first.goldInr;
          const silverDiff = last.silverInr - first.silverInr;
          const goldPct = ((goldDiff / first.goldInr) * 100).toFixed(2);
          const silverPct = ((silverDiff / first.silverInr) * 100).toFixed(2);
          return `Gold: ₹${first.goldInr.toFixed(2)} → ₹${last.goldInr.toFixed(2)} (${goldPct}%)\nSilver: ₹${first.silverInr.toFixed(2)} → ₹${last.silverInr.toFixed(2)} (${silverPct}%)`;
        } catch (err) {
          return 'Could not fetch historical comparison.';
        }
      },
    }),
    new DynamicTool({
      name: 'getBuySellSuggestion',
      description: 'Suggests BUY, SELL, or HOLD for gold/silver based on recent price trends.',
      func: async () => {
        try {
          const { data } = await axios.get('http://localhost:3000/api/v1/prices/history?days=7');
          if (!Array.isArray(data) || data.length < 2) return 'Not enough data.';
          const first = data[0];
          const last = data[data.length - 1];
          const goldDiff = last.goldInr - first.goldInr;
          const silverDiff = last.silverInr - first.silverInr;
          let suggestion = 'HOLD';
          let reason = 'Prices are stable.';
          if (goldDiff > 0 && silverDiff > 0) {
            suggestion = 'SELL';
            reason = 'Both gold and silver have risen in the last week.';
          } else if (goldDiff < 0 && silverDiff < 0) {
            suggestion = 'BUY';
            reason = 'Both gold and silver have dropped in the last week.';
          }
          return `${suggestion}: ${reason}`;
        } catch (err) {
          return 'Could not generate suggestion.';
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
  // For most setups, credentials are loaded from GOOGLE_APPLICATION_CREDENTIALS
  // If you need to use a helper, implement it here
  return undefined;
}

async function swarnaAIAgent(input, chat_history = []) {
  const authClient = await getGcpAuthClient();
  const model = createVertexModel(authClient);
  const tools = createTools();
  console.log('tools :', tools);
  const memory = createMemory(chat_history);
  console.log('memory :', memory);

  const executor = await initializeAgentExecutorWithOptions(tools, model, {
    agentType: 'chat-conversational-react-description',
    memory,
    verbose: process.env.LANGCHAIN_VERBOSE === 'true',
  });

  console.log('input :', input);
  const result = await executor.invoke({ input });
  return result.output;
}

module.exports = { swarnaAIAgent };
