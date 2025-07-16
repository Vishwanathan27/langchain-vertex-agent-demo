const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { VertexAI } = require('@langchain/google-vertexai');
const { initializeAgentExecutorWithOptions } = require('langchain/agents');
const { DynamicTool } = require('langchain/tools');
const enhancedPriceRoutes = require('./routes/enhancedPriceRoutes');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const setupSwagger = require('./swagger');
const aiRoutes = require('./routes/aiRoutes');
const PriceStreamServer = require('./websocket/priceStream');
const db = require('./db/connection');
const { startServer, setupGracefulShutdown, configureCORS } = require('./utils/serverUtils');
const { initializeMockData } = require('./utils/mockDataGenerator');
const dataSyncService = require('./services/dataSync');

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT) || 3000;
const wsPort = parseInt(process.env.WEBSOCKET_PORT) || 3001;

// security
app.use(helmet());
app.use(cors(configureCORS(app)));
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
app.use(cookieParser());

// Make database available to all routes
app.locals.db = db;

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

app.use('/api/metals', enhancedPriceRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/market', aiRoutes);
app.use('/api/auth', authRoutes);

app.use(errorHandler);
setupSwagger(app);

// Start servers gracefully
async function startServers() {
  try {
    // Start main HTTP server
    const { server: httpServer, port: actualPort } = await startServer(app, port, 'HTTP Server');
    
    // Start WebSocket server for real-time price updates
    const priceStreamServer = new PriceStreamServer(wsPort);
    const wsServer = await priceStreamServer.start();
    
    // Setup graceful shutdown
    setupGracefulShutdown(httpServer, wsServer, dataSyncService);
    
    // Display feature flag status
    console.log(`🏗️  Feature Flag - API Provider: ${process.env.PRIMARY_API_PROVIDER || 'metalpriceapi'}`);
    if (process.env.PRIMARY_API_PROVIDER === 'db') {
      console.log('🏦 Running in DB-only mode - no external API calls will be made');
      // Initialize mock data if needed
      await initializeMockData();
      
      // Start data sync service for scheduled updates
      dataSyncService.start();
      console.log('📅 Data sync service started');
    }
    
  } catch (error) {
    console.error('❌ Failed to start servers:', error.message);
    process.exit(1);
  }
}

startServers();
