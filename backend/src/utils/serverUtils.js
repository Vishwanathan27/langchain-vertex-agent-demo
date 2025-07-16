// Server utility functions for graceful startup and shutdown
const net = require('net');

/**
 * Check if a port is available
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Find an available port starting from the given port
 */
async function findAvailablePort(startPort, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * Kill processes running on a specific port
 */
async function killPortProcess(port) {
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    // Find process using the port
    exec(`lsof -ti:${port}`, (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve(); // No process found
        return;
      }
      
      const pids = stdout.trim().split('\n');
      let killed = 0;
      
      pids.forEach(pid => {
        exec(`kill -9 ${pid}`, (killError) => {
          killed++;
          if (killed === pids.length) {
            console.log(`🔥 Killed ${pids.length} process(es) on port ${port}`);
            // Wait a moment for the port to be released
            setTimeout(resolve, 1000);
          }
        });
      });
    });
  });
}

/**
 * Gracefully start server with port conflict handling
 */
async function startServer(app, preferredPort, serverName = 'Server') {
  let port = preferredPort;
  let server;
  
  try {
    // First try to kill any existing process on the port
    await killPortProcess(port);
    
    // Check if port is available
    const isAvailable = await checkPort(port);
    if (!isAvailable) {
      console.log(`⚠️  Port ${port} is still in use, finding alternative...`);
      port = await findAvailablePort(port + 1);
      console.log(`📍 Using port ${port} instead`);
    }
    
    // Start the server
    server = app.listen(port, () => {
      console.log(`🚀 ${serverName} running on port ${port}`);
      
      // Display helpful information
      if (serverName === 'Server') {
        console.log(`📊 Dashboard: http://localhost:${port}`);
        console.log(`🔗 API Docs: http://localhost:${port}/api-docs`);
        console.log(`🏥 Health Check: http://localhost:${port}/api/v1/health`);
      }
    });
    
    return { server, port };
  } catch (error) {
    console.error(`❌ Failed to start ${serverName}:`, error.message);
    throw error;
  }
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown(server, wsServer = null, dataSyncService = null) {
  const shutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    
    // Stop data sync service first
    if (dataSyncService && dataSyncService.stop) {
      dataSyncService.stop();
      console.log('✅ Data sync service stopped');
    }
    
    // Close HTTP server
    server.close(() => {
      console.log('✅ HTTP server closed');
      
      // Close WebSocket server if exists
      if (wsServer && wsServer.close) {
        wsServer.close(() => {
          console.log('✅ WebSocket server closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.log('⏰ Forcefully shutting down...');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon
}

/**
 * Enhanced CORS configuration
 */
function configureCORS(app) {
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // List of allowed origins
      const allowedOrigins = [
        process.env.CORS_ORIGIN,
        `http://localhost:${process.env.FRONTEND_PORT || 5173}`,
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175'
      ].filter(Boolean);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`🚫 CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
    optionsSuccessStatus: 200
  };
  
  return corsOptions;
}

module.exports = {
  checkPort,
  findAvailablePort,
  killPortProcess,
  startServer,
  setupGracefulShutdown,
  configureCORS
};