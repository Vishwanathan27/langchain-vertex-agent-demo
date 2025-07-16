# API Abstraction Layer Documentation

## Overview

The API Abstraction Layer provides a unified interface for fetching precious metals price data from multiple external API providers. It implements the adapter pattern to normalize responses from different providers while providing fallback mechanisms and database caching.

## Architecture

### Key Components

#### 1. MetalPriceService (Main Service)
- **Location**: `src/services/apiAbstraction.js`
- **Purpose**: Main service orchestrating API calls and fallback logic
- **Pattern**: Singleton pattern for consistent state management

#### 2. Provider Mappers
- **GoldAPIMapper**: Handles GoldAPI.io integration
- **MetalPriceAPIMapper**: Handles MetalPriceAPI.com integration
- **Purpose**: Transform provider-specific responses to standardized format

#### 3. Data Service Integration
- **Location**: `src/services/dataService.js`
- **Purpose**: Database operations for caching and fallback
- **Features**: Automatic caching, data validation, cleanup

#### 4. Configuration Management
- **Environment Variables**: Provider selection and API credentials
- **Runtime Switching**: Dynamic provider switching capability
- **Fallback Logic**: Automatic provider switching on failure

## Provider Configuration

### Supported Providers

#### 1. GoldAPI.io
```javascript
const goldApiConfig = {
  baseUrl: 'https://www.goldapi.io/api',
  apiKey: process.env.GOLDAPI_KEY,
  timeout: 10000,
  headers: {
    'x-access-token': process.env.GOLDAPI_KEY
  }
};
```

**Endpoints**:
- Live Prices: `/{metal}/{currency}`
- Historical Prices: `/{metal}/{currency}/{date}`

#### 2. MetalPriceAPI.com
```javascript
const metalPriceApiConfig = {
  baseUrl: 'https://api.metalpriceapi.com/v1',
  apiKey: process.env.METALPRICEAPI_KEY,
  timeout: 10000,
  headers: {}
};
```

**Endpoints**:
- Live Prices: `/latest`
- Historical Prices: `/{date}`
- Conversion: `/convert`
- Timeframe: `/timeframe`
- Change Data: `/change`
- Carat Data: `/carat`
- Symbols: `/symbols`

### Environment Configuration

```bash
# Primary provider selection
PRIMARY_API_PROVIDER=db  # Options: goldapi, metalpriceapi, db

# API credentials
GOLDAPI_KEY=your_goldapi_key
METALPRICEAPI_KEY=your_metalpriceapi_key

# API settings
API_TIMEOUT=10000
API_RETRY_COUNT=3
API_RETRY_DELAY=1000

# Cache settings
CACHE_TTL=300  # 5 minutes

# Sync settings (for DB-only mode)
SYNC_API_PROVIDER=metalpriceapi
```

## Data Flow

### 1. API Request Flow

```
Client Request
    ↓
MetalPriceService
    ↓
Check DB-only Mode
    ↓
[DB Mode] → Database → Response
    ↓
[API Mode] → Check Cache → [Valid] → Database → Response
    ↓
[Cache Invalid] → Primary Provider → [Success] → Database → Response
    ↓
[Primary Fails] → Fallback Provider → [Success] → Database → Response
    ↓
[All Fail] → Database Fallback → Response
```

### 2. Data Synchronization (DB-only Mode)

```
Scheduled Sync
    ↓
Switch to API Provider
    ↓
Fetch All Metals
    ↓
Save to Database
    ↓
Switch Back to DB Mode
    ↓
Log Sync Statistics
```

## Implementation Details

### Standard Response Format

```javascript
const standardResponse = {
  success: true,
  timestamp: "2024-01-15T10:30:00Z",
  data: {
    metal: "XAU",
    currency: "INR",
    price: 5420.50,
    price_gram_24k: 4350.25,
    price_gram_22k: 3985.75,
    price_gram_18k: 3265.38,
    high: 5435.00,
    low: 5380.00,
    open: 5400.00,
    close: 5395.20,
    change: 25.30,
    changePercent: 0.47,
    ask: 5422.00,
    bid: 5419.00,
    symbol: "XAU/INR",
    exchange: "COMEX",
    timestamp: 1705312200,
    provider: "metalpriceapi",
    cached: false
  },
  error: null
};
```

### Error Response Format

```javascript
const errorResponse = {
  success: false,
  timestamp: "2024-01-15T10:30:00Z",
  data: null,
  error: {
    message: "API request failed",
    primaryError: "Connection timeout",
    fallbackError: "Rate limit exceeded"
  }
};
```

### Provider Switching

```javascript
// Runtime provider switching
metalpricerService.switchProvider('goldapi');

// Automatic fallback
try {
  const result = await primaryMapper.fetchLivePrice(metal, currency);
  return createStandardResponse(true, result);
} catch (primaryError) {
  try {
    const result = await fallbackMapper.fetchLivePrice(metal, currency);
    return createStandardResponse(true, result);
  } catch (fallbackError) {
    // Database fallback
    const dbData = await dataService.getLatestPriceFromDB(metal, currency);
    return createStandardResponse(true, dbData);
  }
}
```

## API Methods

### Core Methods

#### 1. Get Live Price
```javascript
const response = await metalpricerService.getLivePrice('XAU', 'INR');
```

**Parameters**:
- `metal`: Metal symbol (XAU, XAG, XPT, XPD)
- `currency`: Currency code (INR, USD, EUR)

**Returns**: Standard response with current price data

#### 2. Get All Live Prices
```javascript
const response = await metalpricerService.getAllLivePrices('INR');
```

**Parameters**:
- `currency`: Currency code (default: INR)

**Returns**: Object with all metal prices

#### 3. Get Historical Price
```javascript
const response = await metalpricerService.getHistoricalPrice('XAU', 'INR', '20240115');
```

**Parameters**:
- `metal`: Metal symbol
- `currency`: Currency code
- `date`: Date in YYYYMMDD format

**Returns**: Historical price data for specified date

### Advanced Methods (MetalPriceAPI only)

#### 1. Currency Conversion
```javascript
const response = await metalpricerService.convertPrice('XAU', 'INR', 1);
```

#### 2. Timeframe Data
```javascript
const response = await metalpricerService.getTimeframeData('2024-01-01', '2024-01-15');
```

#### 3. Change Data
```javascript
const response = await metalpricerService.getChangeData('INR', '2024-01-01', '2024-01-15');
```

#### 4. Carat Data
```javascript
const response = await metalpricerService.getCaratData();
```

#### 5. Available Symbols
```javascript
const response = await metalpricerService.getSymbols();
```

## Database Integration

### Caching Strategy

#### 1. Cache Validation
```javascript
async isCacheValid(metal, currency, isHistorical = false) {
  const result = await db('metal_prices')
    .select('price_timestamp')
    .where({ metal, currency, is_historical: isHistorical })
    .orderBy('price_timestamp', 'desc')
    .first();

  if (!result) return false;

  const cacheAge = (Date.now() - result.price_timestamp.getTime()) / 1000;
  return cacheAge < this.CACHE_TTL;
}
```

#### 2. Data Storage
```javascript
async savePriceData(priceData, provider) {
  await db.raw(`
    INSERT INTO metal_prices (
      metal, currency, price, price_gram_24k, price_gram_22k, price_gram_18k,
      high, low, open, close, change, change_percent, ask, bid, symbol, 
      exchange, provider, price_timestamp, is_historical
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (metal, currency, price_timestamp, provider) 
    DO UPDATE SET
      price = EXCLUDED.price,
      updated_at = CURRENT_TIMESTAMP
  `, [/* parameters */]);
}
```

#### 3. Fallback Retrieval
```javascript
async getLatestPriceFromDB(metal, currency = 'INR') {
  const result = await db('metal_prices')
    .select('*')
    .where({ metal, currency, is_historical: false })
    .orderBy('price_timestamp', 'desc')
    .first();

  return result ? this.transformDbResult(result) : null;
}
```

## Error Handling

### Retry Logic with Exponential Backoff

```javascript
async retry(fn, retries = this.retryCount) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    const delay = this.retryDelay * Math.pow(2, this.retryCount - retries);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return this.retry(fn, retries - 1);
  }
}
```

### Error Classification

```javascript
class APIError extends Error {
  constructor(message, code, provider) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.provider = provider;
    this.timestamp = new Date().toISOString();
  }
}

// Usage
throw new APIError('Rate limit exceeded', 'RATE_LIMIT', 'goldapi');
```

### Comprehensive Error Logging

```javascript
await dataService.logAPICall(
  provider,
  'fetchLivePrice',
  'GET',
  { metal, currency },
  null,
  error.status || 500,
  false,
  responseTime,
  error.message
);
```

## Monitoring and Analytics

### API Usage Statistics

```javascript
async getAPIStats(provider = null, hoursAgo = 24) {
  const stats = await db('api_logs')
    .select(
      'provider',
      db.raw('COUNT(*) as total_calls'),
      db.raw('COUNT(CASE WHEN success = true THEN 1 END) as successful_calls'),
      db.raw('AVG(response_time_ms) as avg_response_time')
    )
    .where('created_at', '>=', new Date(Date.now() - hoursAgo * 60 * 60 * 1000))
    .groupBy('provider');

  return stats.map(stat => ({
    provider: stat.provider,
    totalCalls: parseInt(stat.total_calls),
    successfulCalls: parseInt(stat.successful_calls),
    successRate: (stat.successful_calls / stat.total_calls * 100).toFixed(2),
    avgResponseTime: parseFloat(stat.avg_response_time).toFixed(2)
  }));
}
```

### Health Check

```javascript
async healthCheck(provider) {
  try {
    const startTime = Date.now();
    const mapper = this.getMapper(provider);
    await mapper.fetchLivePrice('XAU', 'INR');
    const responseTime = Date.now() - startTime;
    
    return { 
      provider, 
      status: 'healthy', 
      responseTime,
      timestamp: new Date().toISOString() 
    };
  } catch (error) {
    return { 
      provider, 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString() 
    };
  }
}
```

## Performance Optimization

### Connection Pooling

```javascript
const axiosInstance = axios.create({
  timeout: API_TIMEOUT,
  maxRedirects: 3,
  maxContentLength: 50 * 1024 * 1024, // 50MB
  httpsAgent: new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 1000,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 60000,
    freeSocketTimeout: 30000
  })
});
```

### Response Caching

```javascript
const cache = new Map();

async function getCachedResponse(key, ttl = 300000) {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp) < ttl) {
    return cached.data;
  }
  return null;
}
```

### Batch Operations

```javascript
async getAllLivePrices(currency = 'INR') {
  // Use batch endpoint when available
  if (this.primaryProvider === 'metalpriceapi') {
    const mapper = this.getMapper('metalpriceapi');
    return await mapper.fetchAllLivePrices(currency);
  }
  
  // Otherwise fetch individually
  const results = {};
  for (const metal of SUPPORTED_METALS) {
    const response = await this.getLivePrice(metal, currency);
    if (response.success) {
      results[METAL_NAMES[metal]] = response.data;
    }
  }
  return results;
}
```

## Testing

### Unit Tests

```javascript
describe('MetalPriceService', () => {
  beforeEach(() => {
    // Reset service state
    metalpricerService.switchProvider('metalpriceapi');
  });

  describe('getLivePrice', () => {
    it('should return live price data', async () => {
      const response = await metalpricerService.getLivePrice('XAU', 'INR');
      
      expect(response.success).toBe(true);
      expect(response.data.metal).toBe('XAU');
      expect(response.data.currency).toBe('INR');
      expect(response.data.price).toBeGreaterThan(0);
    });

    it('should handle API failures with fallback', async () => {
      // Mock primary provider failure
      jest.spyOn(MetalPriceAPIMapper, 'fetchLivePrice')
        .mockRejectedValue(new Error('API Error'));
      
      const response = await metalpricerService.getLivePrice('XAU', 'INR');
      
      // Should still succeed with fallback
      expect(response.success).toBe(true);
    });
  });
});
```

### Integration Tests

```javascript
describe('API Integration', () => {
  it('should fetch real data from MetalPriceAPI', async () => {
    const response = await metalpricerService.getLivePrice('XAU', 'INR');
    
    expect(response.success).toBe(true);
    expect(response.data.price).toBeGreaterThan(0);
    expect(response.data.timestamp).toBeDefined();
  });

  it('should handle rate limiting gracefully', async () => {
    // Make multiple rapid requests
    const promises = Array(10).fill().map(() => 
      metalpricerService.getLivePrice('XAU', 'INR')
    );
    
    const responses = await Promise.all(promises);
    
    // All should succeed (cached or from DB)
    responses.forEach(response => {
      expect(response.success).toBe(true);
    });
  });
});
```

## Security Considerations

### API Key Management

```javascript
// Use environment variables for API keys
const apiKey = process.env.GOLDAPI_KEY;
if (!apiKey) {
  throw new Error('GOLDAPI_KEY environment variable is required');
}

// Validate API key format
if (!apiKey.match(/^[a-z0-9-]+$/)) {
  throw new Error('Invalid API key format');
}
```

### Rate Limiting

```javascript
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  async checkLimit(provider) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(provider)) {
      this.requests.set(provider, []);
    }
    
    const providerRequests = this.requests.get(provider);
    const recentRequests = providerRequests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.maxRequests) {
      throw new Error(`Rate limit exceeded for ${provider}`);
    }
    
    recentRequests.push(now);
    this.requests.set(provider, recentRequests);
  }
}
```

### Input Validation

```javascript
function validateMetal(metal) {
  const validMetals = ['XAU', 'XAG', 'XPT', 'XPD'];
  if (!validMetals.includes(metal)) {
    throw new Error(`Invalid metal: ${metal}`);
  }
}

function validateCurrency(currency) {
  const validCurrencies = ['INR', 'USD', 'EUR', 'GBP'];
  if (!validCurrencies.includes(currency)) {
    throw new Error(`Invalid currency: ${currency}`);
  }
}
```

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify API key is correctly set in environment
   - Check API key validity with provider
   - Ensure sufficient API quota

2. **Connection Timeouts**
   - Increase timeout values
   - Check network connectivity
   - Verify firewall settings

3. **Rate Limiting**
   - Implement proper rate limiting
   - Use caching to reduce API calls
   - Consider upgrading API plan

4. **Data Inconsistencies**
   - Verify data transformation logic
   - Check provider response format changes
   - Validate database schema

### Debug Mode

```javascript
// Enable debug logging
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('API Request:', {
    provider: this.primaryProvider,
    metal,
    currency,
    timestamp: new Date().toISOString()
  });
}
```

## Best Practices

### 1. Error Handling
- Always implement fallback mechanisms
- Log errors with sufficient context
- Provide meaningful error messages

### 2. Performance
- Use appropriate caching strategies
- Implement connection pooling
- Optimize database queries

### 3. Security
- Validate all inputs
- Use secure API key storage
- Implement rate limiting

### 4. Monitoring
- Track API usage and performance
- Monitor error rates
- Set up alerting for issues

### 5. Testing
- Test with real API data
- Mock external dependencies
- Implement integration tests

## Migration Guide

### From Single Provider to Multi-Provider

1. **Update Configuration**
```javascript
// Before
const goldApiService = new GoldAPIService(apiKey);

// After
const metalPriceService = new MetalPriceService();
metalPriceService.switchProvider('goldapi');
```

2. **Update Method Calls**
```javascript
// Before
const price = await goldApiService.getPrice('XAU', 'INR');

// After
const response = await metalPriceService.getLivePrice('XAU', 'INR');
const price = response.data;
```

3. **Handle Response Format**
```javascript
// Before
if (price.error) {
  // Handle error
}

// After
if (!response.success) {
  // Handle error
  console.error(response.error);
}
```

## FAQ

### Q: How do I add a new API provider?
A: Create a new mapper class implementing the standard methods, add configuration, and update the provider factory.

### Q: How do I handle API rate limits?
A: Implement caching, use database fallbacks, and consider upgrading API plans.

### Q: How do I monitor API performance?
A: Use the built-in logging and statistics features, implement health checks, and set up monitoring dashboards.

### Q: How do I switch providers at runtime?
A: Use the `switchProvider()` method, but ensure proper fallback handling.

### Q: How do I handle API downtime?
A: The system automatically falls back to alternative providers and database cache.