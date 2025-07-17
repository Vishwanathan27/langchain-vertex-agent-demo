# SwarnaAI API Reference

## Overview

SwarnaAI provides a comprehensive RESTful API for precious metals price tracking, historical data analysis, and AI-powered market insights. All API endpoints return JSON responses with consistent error handling.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-07-17T06:30:00.000Z",
  "error": null
}
```

## Error Responses

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-07-17T06:30:00.000Z"
}
```

## Endpoints

### Authentication

#### POST /api/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    }
  }
}
```

#### POST /api/auth/signup
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Metals Price API

#### GET /api/metals/live
Get current live prices for all metals.

**Response:**
```json
{
  "success": true,
  "data": {
    "metals": {
      "gold": {
        "symbol": "XAU/INR",
        "price": 287703.55,
        "change": 0,
        "changePercent": 0,
        "timestamp": "2025-07-17T06:30:00.000Z"
      },
      "silver": {
        "symbol": "XAG/INR", 
        "price": 3290.42,
        "change": 0,
        "changePercent": 0,
        "timestamp": "2025-07-17T06:30:00.000Z"
      }
    }
  }
}
```

#### GET /api/metals/{metal}/live
Get current live price for a specific metal.

**Parameters:**
- `metal`: Metal symbol (gold, silver, platinum, palladium)

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "XAU/INR",
    "price": 287703.55,
    "change": 0,
    "changePercent": 0,
    "timestamp": "2025-07-17T06:30:00.000Z"
  }
}
```

#### GET /api/metals/timeframe
Get historical price data for a date range.

**Query Parameters:**
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)
- `currency`: Currency code (default: INR)
- `metals`: Comma-separated metal symbols (default: XAU,XAG)

**Example:**
```bash
GET /api/metals/timeframe?start_date=2024-07-17&end_date=2025-07-17&metals=XAU,XAG&currency=INR
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rates": {
      "2024-07-17": {
        "XAU": 287000.00,
        "XAG": 3250.00
      },
      "2024-07-18": {
        "XAU": 287500.00,
        "XAG": 3280.00
      }
    },
    "unit": "per_ounce",
    "currency": "INR"
  }
}
```

#### POST /api/metals/convert
Convert between different metals or currencies.

**Request:**
```json
{
  "from": "XAU",
  "to": "INR",
  "amount": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "from": "XAU",
    "to": "INR", 
    "amount": 1,
    "result": 287703.55,
    "rate": 287703.55,
    "timestamp": "2025-07-17T06:30:00.000Z"
  }
}
```

### AI-Powered Insights

#### GET /api/metals/ai/assistant
Get AI-generated assistant insights about current market conditions.

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      "Gold flat at ₹287,703; watch for breakout signals.",
      "Silver stable; industrial demand key for next move."
    ]
  },
  "timestamp": "2025-07-17T06:30:00.000Z"
}
```

#### GET /api/metals/ai/market-insights
Get structured market analysis with AI recommendations.

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "title": "MARKET_CONSOLIDATION",
        "description": "Gold and silver prices showing consolidation patterns."
      },
      {
        "title": "LOW_VOLATILITY",
        "description": "Reduced price volatility indicates market stability."
      }
    ],
    "aiRecommendation": "Monitor for breakout signals; maintain neutral stance.",
    "analysis": {
      "trend": "neutral",
      "confidence": 0.75,
      "timeframe": "short_term"
    }
  },
  "timestamp": "2025-07-17T06:30:00.000Z"
}
```

#### POST /api/metals/ai/chat
Chat with AI assistant about market conditions.

**Request:**
```json
{
  "query": "What is the current gold trend and should I buy now?",
  "context": {
    "selectedMetal": "gold",
    "userPreferences": {
      "riskTolerance": "moderate",
      "investmentHorizon": "long_term"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "query": "What is the current gold trend and should I buy now?",
  "response": "Based on current market data, gold is stable at ₹287,703.55, showing a 0% change. This indicates consolidation. However, I cannot provide investment advice. Consult a financial advisor for investment decisions.",
  "timestamp": "2025-07-17T06:30:00.000Z"
}
```

### Admin API

#### POST /api/metals/admin/provider/switch
Switch the active API provider.

**Request:**
```json
{
  "provider": "db"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "previousProvider": "metalpriceapi",
    "newProvider": "db",
    "switchedAt": "2025-07-17T06:30:00.000Z"
  }
}
```

#### GET /api/metals/admin/sync/status
Get data synchronization status.

**Response:**
```json
{
  "success": true,
  "data": {
    "lastSync": "2025-07-17T06:00:00.000Z",
    "nextSync": "2025-07-18T06:00:00.000Z",
    "status": "healthy",
    "recordsProcessed": 4,
    "errors": 0
  }
}
```

#### POST /api/metals/admin/sync/trigger
Manually trigger data synchronization.

**Response:**
```json
{
  "success": true,
  "data": {
    "syncId": "sync_12345",
    "status": "started",
    "timestamp": "2025-07-17T06:30:00.000Z"
  }
}
```

#### GET /api/metals/admin/ai/health
Check AI service health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "vertexAiConnected": true,
    "lastAiCall": "2025-07-17T06:29:00.000Z",
    "averageResponseTime": "1.2s",
    "errorRate": "0%"
  }
}
```

## WebSocket API

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3001');
```

### Subscribe to Price Updates
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  metals: ['gold', 'silver'],
  user: { id: 123, token: 'jwt_token' }
}));
```

### Price Update Message
```javascript
{
  "type": "priceUpdate",
  "data": {
    "metal": "gold",
    "price": 287703.55,
    "change": 125.50,
    "changePercent": 0.04,
    "timestamp": "2025-07-17T06:30:00.000Z"
  }
}
```

## Rate Limiting

- **Anonymous users**: 100 requests per hour
- **Authenticated users**: 1000 requests per hour
- **Admin users**: 5000 requests per hour

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## Examples

### Complete Price Tracking Flow

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { token } = await loginResponse.json();

// 2. Get live prices
const pricesResponse = await fetch('/api/metals/live', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const prices = await pricesResponse.json();

// 3. Get AI insights
const aiResponse = await fetch('/api/metals/ai/assistant', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const insights = await aiResponse.json();

// 4. Connect to WebSocket for real-time updates
const ws = new WebSocket('ws://localhost:3001');
ws.send(JSON.stringify({
  type: 'subscribe',
  metals: ['gold', 'silver'],
  token: token
}));
```

### Historical Data Analysis

```javascript
// Get 1-year historical data
const historicalData = await fetch('/api/metals/timeframe?' + new URLSearchParams({
  start_date: '2024-01-01',
  end_date: '2025-01-01',
  metals: 'XAU,XAG',
  currency: 'INR'
}), {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await historicalData.json();
console.log('1-year price history:', data.rates);
```

## Support

For API support and documentation updates, please refer to:
- [GitHub Issues](https://github.com/your-repo/swarnaai/issues)
- [API Documentation](http://localhost:3000/api-docs) (when running locally)
- [WebSocket Documentation](./WEBSOCKET_API.md)