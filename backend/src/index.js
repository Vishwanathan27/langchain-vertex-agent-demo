const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { VertexAI } = require('@langchain/google-vertexai');
const { initializeAgentExecutorWithOptions } = require('langchain/agents');
const { DynamicTool } = require('langchain/tools');
const priceRoutes = require('./routes/priceRoutes');
const enhancedPriceRoutes = require('./routes/enhancedPriceRoutes');
const healthRoutes = require('./routes/healthRoutes');
const errorHandler = require('./middleware/errorHandler');
const setupSwagger = require('./swagger');
const aiRoutes = require('./routes/aiRoutes');
const PriceStreamServer = require('./websocket/priceStream');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// security
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN })); // adjust if FE port differs
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100, // 100 requests per IP
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const model = new VertexAI({
  credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  project: process.env.PROJECT_ID,
  location: process.env.LOCATION,
  model: process.env.MODEL,
});

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

app.use('/api/v1/prices', priceRoutes);
app.use('/api/metals', enhancedPriceRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/market', aiRoutes);

app.use(errorHandler);
setupSwagger(app);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Start WebSocket server for real-time price updates
const priceStreamServer = new PriceStreamServer(3001);
priceStreamServer.start();
