// SwarnaAI conversational agent using LangChain, Vertex AI, and DynamicTool
const { ChatVertexAI } = require('@langchain/google-vertexai');
const { initializeAgentExecutorWithOptions } = require('langchain/agents');
const { BufferMemory, ChatMessageHistory } = require('langchain/memory');
const { DynamicTool } = require('langchain/tools');
const { loadCredentials } = require('../utils/googleCreds');
const chrono = require('chrono-node');

const SYSTEM_PROMPT = `You are SwarnaAI, a friendly and knowledgeable financial assistant specializing in the Indian precious metals market. Your mission is to provide users with clear, accurate, and insightful information about gold and silver prices.

**Your Persona:**
- **Polite and Professional:** Always address users with respect and maintain a positive tone.
- **Market-Savvy:** Demonstrate your expertise by providing context and comparisons.
- **Helpful and Guiding:** Encourage users to think critically and seek professional advice.
- **Rooted in India:** Frame your responses for an Indian audience, using INR and local market context.

**Core Capabilities:**
- **Current Prices:** You can fetch the latest gold and silver prices.
- **Historical Analysis:** You can compare prices over various timeframes (e.g., "last week," "past 30 days," or between specific dates).
- **Clear Explanations:** You break down market changes into simple terms, explaining the difference in both percentage and absolute INR.

**Interaction Guidelines:**
- **Be Clear and Concise:** Avoid jargon. Explain concepts in a way that is easy for a non-expert to understand.
- **Use Real-World Analogies:** When helpful, use analogies to make price changes more tangible (e.g., "the price of 10 grams of gold has increased by the cost of a small family dinner").
- **Always Include a Disclaimer:** Conclude every response that contains market data with the following disclaimer: "Note: This is an AI-generated market insight. Always consult a financial advisor before making investment decisions."
- **Handle Ambiguity:** If a user's request is unclear, ask for clarification. For example, if they ask for a price without specifying a date, assume they mean today's price but mention it.

**Example Questions You Can Handle:**
- 'Compare gold price today vs last week.'
- 'How much did gold change in the past 30 days?'
- 'What was the gold price difference between today and May 1, 2024?'
- 'What was the gold price yesterday compared to now?'`;

const GOLD_API_BASE = process.env.GOLD_API_BASE || 'https://www.goldapi.io/api';

const METAL_SYMBOLS = {
  gold: 'XAU',
  silver: 'XAG',
  platinum: 'XPT',
  palladium: 'XPD',
};

function getMetalInfo(input) {
  const metalInput = (input || '').toLowerCase();
  for (const metal in METAL_SYMBOLS) {
    if (metalInput.includes(metal)) {
      return { symbol: METAL_SYMBOLS[metal], name: metal };
    }
  }
  return { symbol: 'XAU', name: 'gold' }; // Default to gold
}

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
      description: 'Returns the latest price for a specified precious metal (gold, silver, platinum, or palladium) in INR for India. Input should be a string containing the name of the metal.',
      func: async (input) => {
        try {
          const { symbol: metalSymbol, name: metalName } = getMetalInfo(input);
          const res = await fetch(`${GOLD_API_BASE}/${metalSymbol}/INR`, {
            method: 'GET',
            headers: {
              'x-access-token': GOLD_API_KEY,
              'Content-Type': 'application/json',
            },
            redirect: 'follow',
          });
          const data = await res.json();
          return JSON.stringify({ ...data, metal: metalName });
        } catch (err) {
          return `Could not fetch current price for ${input}.`;
        }
      },
    }),
    new DynamicTool({
      name: 'getHistoricalComparison',
      description: 'Returns the price change for a specified precious metal (gold, silver, platinum, or palladium) in INR and percent over a natural language period (e.g., "last week", "past 30 days", "yesterday", or between two dates). The input must contain both the metal name and the time period.',
      func: async (input) => {
        try {
          const { symbol: metalSymbol, name: metalName } = getMetalInfo(input);
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
            fetch(`${GOLD_API_BASE}/${metalSymbol}/INR/${prevStr}`, {
              method: 'GET',
              headers: {
                'x-access-token': GOLD_API_KEY,
                'Content-Type': 'application/json',
              },
              redirect: 'follow',
            }),
            fetch(`${GOLD_API_BASE}/${metalSymbol}/INR/${todayStr}`, {
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
          const priceDiff = todayData.price - prevData.price;
          const pricePct = ((priceDiff / prevData.price) * 100).toFixed(2);
          const capitalizedMetalName =
            metalName.charAt(0).toUpperCase() + metalName.slice(1);
          return `${capitalizedMetalName}: ₹${prevData.price} → ₹${
            todayData.price
          } (Change: ₹${priceDiff.toFixed(2)} / ${pricePct}%)`;
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
