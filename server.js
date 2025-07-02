const express = require('express');
const dotenv = require('dotenv');
const { VertexAI } = require('@langchain/google-vertexai');
const { ChatAgentExecutor, initializeAgentExecutorWithOptions } = require('langchain/agents');
const { DynamicTool } = require('langchain/tools');

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// Vertex AI model setup
const model = new VertexAI({
  credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
  model: process.env.MODEL,
});

// Example tools
const tools = [
  new DynamicTool({
    name: 'getDate',
    description: 'Returns the current date in YYYY-MM-DD format',
    func: async () => new Date().toISOString().slice(0, 10),
  }),
  new DynamicTool({
    name: 'getGreeting',
    description: 'Returns a friendly greeting message',
    func: async () => 'Hello! How can I help you today?',
  }),
];

let agentExecutor;
async function getAgentExecutor() {
  if (!agentExecutor) {
    agentExecutor = await initializeAgentExecutorWithOptions(tools, model, {
      agentType: 'chat-conversational-react-description',
      verbose: process.env.LANGCHAIN_VERBOSE === 'true',
    });
  }
  return agentExecutor;
}

// POST /api/converse
app.post('/api/converse', async (req, res) => {
  try {
    const { input, chat_history } = req.body;
    if (!input) {
      return res.status(400).json({ error: 'Missing input' });
    }
    const executor = await getAgentExecutor();
    const result = await executor.call({
      input,
      chat_history: chat_history || [],
    });
    res.json({ response: result.output });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
