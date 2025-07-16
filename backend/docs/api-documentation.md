# Metal Price API Documentation

## Overview

This document describes the API abstraction layer for fetching precious metal prices from multiple third-party providers. The system supports seamless switching between different API providers with standardized input/output schemas.

## Supported Providers

### 1. MetalPriceAPI (Primary)
- **Base URL**: `https://api.metalpriceapi.com/v1`
- **API Key**: `6f36b6777c975becf41d8e19ded22645`
- **Features**: Real-time prices, historical data, conversion, timeframe analysis

### 2. GoldAPI (Fallback)
- **Base URL**: `https://www.goldapi.io/api`
- **API Key**: Configured via environment variable
- **Features**: Real-time prices, historical data, detailed metal information

## API Endpoints

### MetalPriceAPI Endpoints

#### 1. Symbols
```
GET https://api.metalpriceapi.com/v1/symbols
```
Get list of all supported currencies and metals.

#### 2. Latest Prices
```
GET https://api.metalpriceapi.com/v1/latest?api_key={API_KEY}&base={BASE}&currencies={CURRENCIES}
```
Get real-time exchange rate data for all available/specific currencies.

**Parameters:**
- `api_key`: Your API key
- `base`: Base currency (e.g., INR, USD)
- `currencies`: Comma-separated list of metal symbols (e.g., XAU,XAG,XPT,XPD)

#### 3. Historical Data
```
GET https://api.metalpriceapi.com/v1/{YYYY-MM-DD}?api_key={API_KEY}&base={BASE}&currencies={CURRENCIES}
```
Get historical rates for a specific day.

#### 4. Convert
```
GET https://api.metalpriceapi.com/v1/convert?api_key={API_KEY}&from={FROM}&to={TO}&amount={AMOUNT}
```
Convert one currency to another based on real-time exchange rates.

#### 5. Timeframe
```
GET https://api.metalpriceapi.com/v1/timeframe?api_key={API_KEY}&start_date={START}&end_date={END}&base={BASE}&currencies={CURRENCIES}
```
Request exchange rates for a specific period of time.

#### 6. Change
```
GET https://api.metalpriceapi.com/v1/change?api_key={API_KEY}&base={BASE}&start_date={START}&end_date={END}&currencies={CURRENCIES}
```
Request currency change parameters (margin, percentage).

#### 7. Carat
```
GET https://api.metalpriceapi.com/v1/carat?api_key={API_KEY}
```
Request gold prices by Carat.

## Input/Output Schemas

### Standard Metal Symbols
```json
{
  "XAU": "Gold",
  "XAG": "Silver", 
  "XPT": "Platinum",
  "XPD": "Palladium"
}
```

### Standard Currency Codes
```json
{
  "INR": "Indian Rupee",
  "USD": "US Dollar",
  "EUR": "Euro"
}
```

### MetalPriceAPI Response Schema

#### Latest Prices Response
```json
{
  "success": true,
  "timestamp": 1640995200,
  "base": "INR",
  "rates": {
    "XAU": 0.0000034758,
    "XAG": 0.0004567,
    "XPT": 0.0000056789,
    "XPD": 0.0000078901
  }
}
```

#### Historical Data Response
```json
{
  "success": true,
  "historical": true,
  "date": "2021-01-01",
  "timestamp": 1609459200,
  "base": "INR",
  "rates": {
    "XAU": 0.0000034758,
    "XAG": 0.0004567
  }
}
```

#### Convert Response
```json
{
  "success": true,
  "query": {
    "from": "USD",
    "to": "XAU",
    "amount": 100
  },
  "info": {
    "timestamp": 1640995200,
    "rate": 0.0005432
  },
  "result": 0.05432
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": 101,
    "message": "Invalid API key"
  }
}
```

### GoldAPI Response Schema

#### Live Price Response
```json
{
  "metal": "XAU",
  "currency": "INR",
  "price": 287654.32,
  "price_gram_24k": 9250.45,
  "price_gram_22k": 8479.91,
  "price_gram_18k": 6937.84,
  "high": 288000.00,
  "low": 286000.00,
  "open": 287000.00,
  "close": 286500.00,
  "change": 1154.32,
  "changePercent": 0.40,
  "timestamp": 1640995200,
  "ask": 287700.00,
  "bid": 287600.00,
  "symbol": "XAUINR",
  "exchange": "GOLDAPI"
}
```

### Standardized Internal Response Schema

Our API abstraction layer converts all provider responses to this standard format:

```json
{
  "success": true,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": {
    "metal": "XAU",
    "currency": "INR",
    "price": 287654.32,
    "price_gram_24k": 9250.45,
    "price_gram_22k": 8479.91,
    "price_gram_18k": 6937.84,
    "high": 288000.00,
    "low": 286000.00,
    "open": 287000.00,
    "close": 286500.00,
    "change": 1154.32,
    "changePercent": 0.40,
    "timestamp": 1640995200,
    "ask": 287700.00,
    "bid": 287600.00,
    "symbol": "XAUINR",
    "exchange": "MetalPriceAPI"
  },
  "error": null
}
```

### Error Response Schema
```json
{
  "success": false,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "data": null,
  "error": {
    "message": "Both primary and fallback APIs failed",
    "primaryError": "MetalPriceAPI Error: API key invalid",
    "fallbackError": "GoldAPI Error: Connection timeout"
  }
}
```

## Environment Configuration

### Required Environment Variables

```bash
# Primary API Provider (metalpriceapi or goldapi)
PRIMARY_API_PROVIDER=metalpriceapi

# API Keys
METALPRICEAPI_KEY=6f36b6777c975becf41d8e19ded22645
GOLDAPI_KEY=your_goldapi_key_here

# API Settings
API_TIMEOUT=10000
API_RETRY_COUNT=3
API_RETRY_DELAY=1000
```

## Data Mapping Logic

### MetalPriceAPI to Standard Format

The MetalPriceAPI returns rates as fractions (e.g., 1 INR = 0.0000034758 XAU), which need to be converted to price per ounce:

```javascript
// Convert rate to INR price per ounce
const pricePerOunce = 1 / rate;

// Calculate gram prices for gold
const pricePerGram = pricePerOunce / 31.1035; // Troy ounce = 31.1035 grams
const price_gram_24k = pricePerGram;
const price_gram_22k = pricePerGram * 0.917; // 22k is 91.7% pure
const price_gram_18k = pricePerGram * 0.750; // 18k is 75% pure
```

### GoldAPI to Standard Format

GoldAPI already provides data in the desired format, so minimal transformation is needed:

```javascript
// Direct mapping from GoldAPI response
const standardFormat = {
  metal: response.metal,
  currency: response.currency,
  price: response.price,
  price_gram_24k: response.price_gram_24k,
  // ... other fields
};
```

## API Switching Strategy

### 1. Environment-Based Switching
- Primary provider is set via `PRIMARY_API_PROVIDER` environment variable
- Fallback provider is automatically determined (opposite of primary)

### 2. Runtime Switching
- Admin endpoint allows switching providers at runtime
- Changes take effect immediately for new requests

### 3. Automatic Failover
- If primary API fails, system automatically tries fallback
- Retry logic with exponential backoff
- Comprehensive error logging

### 4. Health Monitoring
- Health check endpoints for each provider
- Status monitoring for proactive switching
- Error tracking and alerting

## Usage Examples

### Get Live Gold Price
```javascript
const metalPriceService = require('./services/apiAbstraction');

const response = await metalPriceService.getLivePrice('XAU', 'INR');
if (response.success) {
  console.log(`Gold price: ₹${response.data.price} per ounce`);
}
```

### Get All Metal Prices
```javascript
const response = await metalPriceService.getAllLivePrices('INR');
if (response.success) {
  console.log('All metal prices:', response.data);
}
```

### Switch API Provider
```javascript
metalPriceService.switchProvider('goldapi');
```

### Check API Health
```javascript
const health = await metalPriceService.healthCheck('metalpriceapi');
console.log('API Health:', health);
```

## Error Handling

The system implements comprehensive error handling:

1. **API Timeouts**: Configurable timeout values
2. **Rate Limiting**: Retry logic with exponential backoff
3. **Authentication Errors**: Clear error messages for invalid API keys
4. **Network Errors**: Automatic fallback to secondary provider
5. **Data Validation**: Schema validation for all responses

## Performance Optimization

1. **Batch Requests**: MetalPriceAPI supports fetching multiple metals in one request
2. **Caching**: Response caching to reduce API calls
3. **Connection Pooling**: Reuse HTTP connections
4. **Timeout Management**: Appropriate timeout values for different operations

## Security Considerations

1. **API Key Management**: Store keys in environment variables
2. **Rate Limiting**: Implement client-side rate limiting
3. **Input Validation**: Validate all input parameters
4. **Error Sanitization**: Don't expose sensitive error details to clients