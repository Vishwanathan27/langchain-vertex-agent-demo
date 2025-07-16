// WebSocket server for real-time precious metals price streaming
const WebSocket = require('ws');
const { getGoldApiLivePrice } = require('../services/goldapiPriceService');
const { findAvailablePort, killPortProcess } = require('../utils/serverUtils');

const METALS = {
  gold: 'XAU',
  silver: 'XAG',
  platinum: 'XPT',
  palladium: 'XPD'
};

class PriceStreamServer {
  constructor(port = 3001) {
    this.port = port;
    this.wss = null;
    this.clients = new Set();
    this.priceUpdateInterval = null;
    this.lastPrices = {};
  }

  async start() {
    try {
      // Handle port conflicts
      await killPortProcess(this.port);
      
      // Find available port if needed
      let actualPort = this.port;
      try {
        this.wss = new WebSocket.Server({ port: actualPort });
      } catch (error) {
        if (error.code === 'EADDRINUSE') {
          actualPort = await findAvailablePort(this.port + 1);
          this.wss = new WebSocket.Server({ port: actualPort });
          console.log(`📍 WebSocket server using port ${actualPort} instead of ${this.port}`);
        } else {
          throw error;
        }
      }
      
      this.port = actualPort;
      
      this.wss.on('connection', (ws, req) => {
        console.log('New WebSocket connection established');
        this.clients.add(ws);
      
        // Send current prices to the new client
        this.sendCurrentPrices(ws);
        
        ws.on('close', () => {
          console.log('WebSocket connection closed');
          this.clients.delete(ws);
        });
        
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.clients.delete(ws);
        });
        
        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            this.handleClientMessage(ws, data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        });
      });
      
      // Start price update interval
      this.startPriceUpdates();
      
      console.log(`🔌 WebSocket server started on port ${this.port}`);
      return this.wss;
    } catch (error) {
      console.error('❌ Failed to start WebSocket server:', error);
      throw error;
    }
  }

  async sendCurrentPrices(ws) {
    try {
      const prices = await this.fetchAllPrices();
      ws.send(JSON.stringify({
        type: 'priceUpdate',
        data: prices,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error sending current prices:', error);
    }
  }

  async fetchAllPrices() {
    const prices = {};
    
    const pricePromises = Object.keys(METALS).map(async (metal) => {
      try {
        const priceData = await getGoldApiLivePrice();
        return { metal, data: priceData };
      } catch (error) {
        console.error(`Error fetching ${metal} price:`, error);
        return { metal, data: { error: `Failed to fetch ${metal} price` } };
      }
    });

    const results = await Promise.all(pricePromises);
    
    results.forEach(({ metal, data }) => {
      if (!data.error) {
        prices[metal] = {
          price: data.price_ounce || data.price,
          change: data.ch || 0,
          changePercent: data.chp || 0,
          high: data.high || data.price,
          low: data.low || data.price,
          timestamp: new Date().toISOString()
        };
      }
    });

    return prices;
  }

  startPriceUpdates() {
    // Update prices every 60 seconds
    this.priceUpdateInterval = setInterval(async () => {
      try {
        const prices = await this.fetchAllPrices();
        
        // Check for significant price changes
        const updates = this.detectPriceChanges(prices);
        
        if (updates.length > 0) {
          this.broadcast({
            type: 'priceUpdate',
            data: prices,
            changes: updates,
            timestamp: new Date().toISOString()
          });
        }
        
        this.lastPrices = prices;
      } catch (error) {
        console.error('Error updating prices:', error);
      }
    }, 60000); // 60 seconds
  }

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

  broadcast(message) {
    const messageString = JSON.stringify(message);
    
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageString);
      }
    });
  }

  handleClientMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        // Client wants to subscribe to specific metals
        ws.subscribedMetals = data.metals || Object.keys(METALS);
        break;
      
      case 'unsubscribe':
        // Client wants to unsubscribe from specific metals
        ws.subscribedMetals = ws.subscribedMetals?.filter(metal => 
          !data.metals.includes(metal)
        ) || [];
        break;
      
      case 'ping':
        // Heartbeat
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  stop() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
    
    if (this.wss) {
      this.wss.close();
    }
    
    console.log('WebSocket server stopped');
  }
}

module.exports = PriceStreamServer;