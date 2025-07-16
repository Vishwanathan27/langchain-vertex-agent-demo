# WebSocket System Documentation

## Overview

The SwarnaAI application implements a real-time WebSocket system for streaming precious metals price updates to connected clients. This document outlines the WebSocket architecture, implementation details, and usage patterns.

## Architecture

### System Components

#### 1. PriceStreamServer
- **Location**: `src/websocket/priceStream.js`
- **Purpose**: Main WebSocket server for real-time price streaming
- **Port**: 3001 (configurable via `WEBSOCKET_PORT` environment variable)

#### 2. Client Connection Management
- **Connection Tracking**: Maintains a Set of active WebSocket connections
- **Automatic Cleanup**: Removes disconnected clients automatically
- **Heartbeat Support**: Implements ping/pong for connection health

#### 3. Data Integration
- **API Abstraction**: Uses the centralized API abstraction service
- **Database Fallback**: Falls back to database data when APIs are unavailable
- **Cache Management**: Implements intelligent caching for price data

## Implementation Details

### Server Initialization

```javascript
const PriceStreamServer = require('./websocket/priceStream');

// Create server instance
const priceStreamServer = new PriceStreamServer(3001);

// Start server
const wsServer = await priceStreamServer.start();
```

### Connection Lifecycle

#### 1. Connection Establishment
```javascript
// Client connection event
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  this.clients.add(ws);
  
  // Send current prices to new client
  this.sendCurrentPrices(ws);
});
```

#### 2. Connection Cleanup
```javascript
// Handle client disconnection
ws.on('close', () => {
  console.log('WebSocket connection closed');
  this.clients.delete(ws);
});

// Handle connection errors
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
  this.clients.delete(ws);
});
```

### Message Protocol

#### Client to Server Messages

##### 1. Subscribe to Metals
```json
{
  "type": "subscribe",
  "metals": ["gold", "silver", "platinum", "palladium"]
}
```

##### 2. Unsubscribe from Metals
```json
{
  "type": "unsubscribe",
  "metals": ["platinum", "palladium"]
}
```

##### 3. Heartbeat
```json
{
  "type": "ping"
}
```

#### Server to Client Messages

##### 1. Price Updates
```json
{
  "type": "priceUpdate",
  "data": {
    "gold": {
      "price": 5420.50,
      "change": 25.30,
      "changePercent": 0.47,
      "high": 5435.00,
      "low": 5380.00,
      "timestamp": "2024-01-15T10:30:00Z"
    },
    "silver": {
      "price": 82.75,
      "change": -0.25,
      "changePercent": -0.30,
      "high": 83.20,
      "low": 82.10,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  },
  "changes": [
    {
      "metal": "gold",
      "oldPrice": 5395.20,
      "newPrice": 5420.50,
      "changePercent": 0.47,
      "direction": "up"
    }
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

##### 2. Heartbeat Response
```json
{
  "type": "pong"
}
```

### Data Flow

#### 1. Price Data Fetching
```javascript
async fetchAllPrices() {
  try {
    const response = await metalpricerService.getAllLivePrices('INR');
    
    if (response.success && response.data) {
      const prices = {};
      
      // Transform API response to WebSocket format
      Object.keys(response.data).forEach(metalName => {
        const metalData = response.data[metalName];
        if (metalData && metalData.price) {
          prices[metalName] = {
            price: metalData.price,
            change: metalData.change || 0,
            changePercent: metalData.changePercent || 0,
            high: metalData.high || metalData.price,
            low: metalData.low || metalData.price,
            timestamp: new Date().toISOString()
          };
        }
      });
      
      return prices;
    }
  } catch (error) {
    console.error('Error fetching all prices:', error);
    return {};
  }
}
```

#### 2. Price Change Detection
```javascript
detectPriceChanges(newPrices) {
  const changes = [];
  
  Object.keys(newPrices).forEach(metal => {
    if (this.lastPrices[metal]) {
      const oldPrice = this.lastPrices[metal].price;
      const newPrice = newPrices[metal].price;
      const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
      
      // Alert for changes greater than 1%
      if (Math.abs(changePercent) > 1) {
        changes.push({
          metal,
          oldPrice,
          newPrice,
          changePercent,
          direction: changePercent > 0 ? 'up' : 'down'
        });
      }
    }
  });
  
  return changes;
}
```

#### 3. Broadcasting Updates
```javascript
broadcast(message) {
  const messageString = JSON.stringify(message);
  
  this.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageString);
    }
  });
}
```

### Configuration

#### Environment Variables

```bash
# WebSocket server port
WEBSOCKET_PORT=3001

# Price update interval (milliseconds)
PRICE_UPDATE_INTERVAL=60000

# WebSocket server timeout
WS_TIMEOUT=30000

# Maximum connections
WS_MAX_CONNECTIONS=100
```

#### Server Configuration

```javascript
// Server options
const serverOptions = {
  port: 3001,
  perMessageDeflate: {
    zlibDeflateOptions: {
      threshold: 1024,
      concurrencyLimit: 10,
    },
    zlibInflateOptions: {
      chunkSize: 2048,
    },
    threshold: 1024,
    concurrencyLimit: 10,
    clientMaxNoContextTakeover: false,
    clientMaxWindowBits: 15,
    serverMaxNoContextTakeover: false,
    serverMaxWindowBits: 15,
    serverMaxNoContextTakeover: false,
    compression: true,
  }
};
```

## Client Integration

### Frontend WebSocket Client

```javascript
class PriceWebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.subscribeToMetals(['gold', 'silver', 'platinum', 'palladium']);
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  subscribeToMetals(metals) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        metals: metals
      }));
    }
  }

  handleMessage(message) {
    switch (message.type) {
      case 'priceUpdate':
        this.onPriceUpdate(message.data, message.changes);
        break;
      case 'pong':
        this.onPong();
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, delay);
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

### React Hook Integration

```javascript
import { useEffect, useState, useCallback } from 'react';

export const useWebSocketPrices = (url) => {
  const [prices, setPrices] = useState({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  const handlePriceUpdate = useCallback((newPrices, changes) => {
    setPrices(newPrices);
    
    // Handle significant price changes
    if (changes && changes.length > 0) {
      changes.forEach(change => {
        console.log(`${change.metal} price ${change.direction}: ${change.changePercent.toFixed(2)}%`);
      });
    }
  }, []);

  useEffect(() => {
    const client = new PriceWebSocketClient(url);
    
    client.onPriceUpdate = handlePriceUpdate;
    
    client.connect();

    return () => {
      client.close();
    };
  }, [url, handlePriceUpdate]);

  return { prices, connected, error };
};
```

## Error Handling

### Connection Errors

```javascript
// Handle connection failures
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
  
  // Log error details
  logger.error('WebSocket connection error', {
    error: error.message,
    code: error.code,
    type: error.type
  });
  
  // Cleanup client
  this.clients.delete(ws);
});
```

### Data Errors

```javascript
// Handle data fetching errors
async fetchAllPrices() {
  try {
    const response = await metalpricerService.getAllLivePrices('INR');
    return response.data;
  } catch (error) {
    console.error('Error fetching prices:', error);
    
    // Return cached data if available
    if (this.lastPrices && Object.keys(this.lastPrices).length > 0) {
      return this.lastPrices;
    }
    
    return {};
  }
}
```

### Broadcasting Errors

```javascript
broadcast(message) {
  const messageString = JSON.stringify(message);
  
  this.clients.forEach(ws => {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageString);
      }
    } catch (error) {
      console.error('Error sending message to client:', error);
      this.clients.delete(ws);
    }
  });
}
```

## Performance Optimization

### Connection Management

```javascript
// Limit maximum connections
const MAX_CONNECTIONS = process.env.WS_MAX_CONNECTIONS || 100;

wss.on('connection', (ws, req) => {
  if (this.clients.size >= MAX_CONNECTIONS) {
    ws.close(1008, 'Server at capacity');
    return;
  }
  
  this.clients.add(ws);
});
```

### Message Compression

```javascript
// Enable per-message deflate compression
const wss = new WebSocket.Server({
  port: 3001,
  perMessageDeflate: {
    threshold: 1024,
    concurrencyLimit: 10,
  }
});
```

### Batch Updates

```javascript
// Batch price updates to reduce message frequency
const BATCH_INTERVAL = 1000; // 1 second

setInterval(() => {
  if (this.pendingUpdates.length > 0) {
    this.broadcast({
      type: 'priceUpdate',
      data: this.pendingUpdates,
      timestamp: new Date().toISOString()
    });
    this.pendingUpdates = [];
  }
}, BATCH_INTERVAL);
```

## Security Considerations

### Authentication

```javascript
// Implement token-based authentication
wss.on('connection', (ws, req) => {
  const token = req.headers.authorization;
  
  if (!token || !isValidToken(token)) {
    ws.close(1008, 'Unauthorized');
    return;
  }
  
  // Store user info with connection
  ws.userId = getUserIdFromToken(token);
  this.clients.add(ws);
});
```

### Rate Limiting

```javascript
// Implement rate limiting for messages
const RATE_LIMIT = 10; // messages per minute
const rateLimiter = new Map();

ws.on('message', (message) => {
  const userId = ws.userId;
  const now = Date.now();
  
  if (!rateLimiter.has(userId)) {
    rateLimiter.set(userId, { count: 0, timestamp: now });
  }
  
  const userLimit = rateLimiter.get(userId);
  
  if (now - userLimit.timestamp > 60000) {
    userLimit.count = 0;
    userLimit.timestamp = now;
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    ws.close(1008, 'Rate limit exceeded');
    return;
  }
  
  userLimit.count++;
  this.handleClientMessage(ws, JSON.parse(message));
});
```

## Monitoring and Logging

### Connection Metrics

```javascript
// Track connection metrics
const metrics = {
  totalConnections: 0,
  activeConnections: 0,
  messagesReceived: 0,
  messagesSent: 0,
  errors: 0
};

// Log metrics periodically
setInterval(() => {
  console.log('WebSocket Metrics:', {
    activeConnections: this.clients.size,
    totalConnections: metrics.totalConnections,
    messagesReceived: metrics.messagesReceived,
    messagesSent: metrics.messagesSent,
    errors: metrics.errors
  });
}, 30000);
```

### Error Tracking

```javascript
// Comprehensive error logging
const logError = (error, context) => {
  logger.error('WebSocket error', {
    error: error.message,
    stack: error.stack,
    context: context,
    timestamp: new Date().toISOString()
  });
};
```

## Testing

### Unit Tests

```javascript
describe('PriceStreamServer', () => {
  let server;
  
  beforeEach(() => {
    server = new PriceStreamServer(3001);
  });
  
  afterEach(() => {
    server.stop();
  });
  
  it('should start server successfully', async () => {
    await server.start();
    expect(server.isRunning).toBe(true);
  });
  
  it('should handle client connections', (done) => {
    server.start().then(() => {
      const ws = new WebSocket('ws://localhost:3001');
      
      ws.on('open', () => {
        expect(server.clients.size).toBe(1);
        done();
      });
    });
  });
});
```

### Integration Tests

```javascript
describe('WebSocket Integration', () => {
  it('should receive price updates', (done) => {
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.on('message', (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'priceUpdate') {
        expect(message.data).toBeDefined();
        expect(message.timestamp).toBeDefined();
        done();
      }
    });
  });
});
```

## Deployment

### Production Configuration

```javascript
// Production WebSocket server configuration
const serverOptions = {
  port: process.env.WS_PORT || 3001,
  maxPayload: 16 * 1024, // 16KB
  perMessageDeflate: true,
  clientTracking: true,
  handleProtocols: (protocols) => {
    return protocols.includes('swarnaai-v1') ? 'swarnaai-v1' : false;
  }
};
```

### Load Balancing

```javascript
// Sticky session configuration for load balancing
const sessionStore = new RedisStore({
  client: redisClient,
  prefix: 'ws-session:'
});

// Use Redis for session management
const sessionManager = {
  store: sessionStore,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if WebSocket server is running
   - Verify port configuration
   - Check firewall settings

2. **Frequent Disconnections**
   - Implement heartbeat mechanism
   - Check network stability
   - Review client-side reconnection logic

3. **Memory Leaks**
   - Ensure proper client cleanup
   - Monitor connection count
   - Review event listener management

4. **Performance Issues**
   - Optimize message frequency
   - Implement connection pooling
   - Use message compression

### Debugging Tools

```javascript
// Enable debug logging
const debug = require('debug')('websocket');

// Debug connection events
ws.on('open', () => debug('Connection opened'));
ws.on('close', () => debug('Connection closed'));
ws.on('error', (error) => debug('Connection error:', error));
```

## FAQ

### Q: How do I handle client reconnections?
A: Implement exponential backoff reconnection logic on the client side and ensure the server can handle reconnections gracefully.

### Q: How do I scale WebSocket connections?
A: Use a load balancer with sticky sessions or implement a Redis-based session store for horizontal scaling.

### Q: How do I secure WebSocket connections?
A: Implement token-based authentication, use WSS (WebSocket Secure), and implement rate limiting.

### Q: How do I handle large numbers of concurrent connections?
A: Optimize server configuration, use connection pooling, and implement proper resource management.

### Q: How do I test WebSocket functionality?
A: Use WebSocket testing libraries, implement unit tests for server logic, and create integration tests for end-to-end functionality.