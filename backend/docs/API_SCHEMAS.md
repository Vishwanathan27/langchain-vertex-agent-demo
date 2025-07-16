# API Schemas Documentation

## Overview
This document outlines the input/output schemas for different metal price APIs and how they are mapped to our internal data structure.

## Internal Data Structure

### Standard Metal Price Response
```json
{
  "success": true,
  "timestamp": "2025-01-16T10:00:00Z",
  "data": {
    "gold": {
      "metal": "XAU",
      "currency": "INR",
      "price": 286877.2,
      "price_gram_24k": 9223.3162,
      "price_gram_22k": 8454.7065,
      "price_gram_18k": 6917.4871,
      "high": 287265.5,
      "low": 285915.7,
      "open": 286299.2,
      "close": 286114.7,
      "change": 762.5,
      "changePercent": 0.27,
      "timestamp": 1752660468,
      "ask": 286887.2,
      "bid": 286877.2,
      "symbol": "FX_IDC:XAUINR",
      "exchange": "IDC"
    },
    "silver": {
      "metal": "XAG",
      "currency": "INR",
      "price": 3267.3,
      "price_gram_24k": 105.0461,
      "price_gram_22k": 96.2923,
      "price_gram_18k": 78.7846,
      "high": 3270.2,
      "low": 3246.4,
      "open": 3246.7,
      "close": 3240.1,
      "change": 27.2,
      "changePercent": 0.84,
      "timestamp": 1752660481,
      "ask": 3272.3,
      "bid": 3267.3,
      "symbol": "FX_IDC:XAGINR",
      "exchange": "IDC"
    },
    "platinum": {
      "metal": "XPT",
      "currency": "INR",
      "price": 118954.04,
      "price_gram_24k": 3824.4612,
      "price_gram_22k": 3505.7561,
      "price_gram_18k": 2868.3459,
      "high": 119284.72,
      "low": 116950,
      "open": 117873.57,
      "close": 117744.65,
      "change": 1209.39,
      "changePercent": 1.03,
      "timestamp": 1752660483,
      "ask": null,
      "bid": null,
      "symbol": "FX_IDC:XPTINR",
      "exchange": "IDC"
    },
    "palladium": {
      "metal": "XPD",
      "currency": "INR",
      "price": 102613.34,
      "price_gram_24k": 3299.0955,
      "price_gram_22k": 3024.1709,
      "price_gram_18k": 2474.3216,
      "high": 104724.86,
      "low": 101830.76,
      "open": 103219.95,
      "close": 103005.08,
      "change": -391.74,
      "changePercent": -0.38,
      "timestamp": 1752660485,
      "ask": null,
      "bid": null,
      "symbol": "FX_IDC:XPDINR",
      "exchange": "IDC"
    }
  }
}
```

## API Providers

### 1. GoldAPI (Current Primary)
**Base URL**: `https://www.goldapi.io/api/`
**Authentication**: API Key in headers

#### Endpoints:
- **Live Prices**: `{metal}/{currency}`
- **Historical**: `{metal}/{currency}/{date}`

#### Request Schema:
```json
{
  "method": "GET",
  "url": "https://www.goldapi.io/api/XAU/INR",
  "headers": {
    "x-access-token": "goldapi-key-here"
  }
}
```

#### Response Schema:
```json
{
  "metal": "XAU",
  "currency": "INR",
  "price": 286877.2,
  "price_gram_24k": 9223.3162,
  "price_gram_22k": 8454.7065,
  "price_gram_18k": 6917.4871,
  "high": 287265.5,
  "low": 285915.7,
  "open": 286299.2,
  "close": 286114.7,
  "change": 762.5,
  "changePercent": 0.27,
  "timestamp": 1752660468,
  "ask": 286887.2,
  "bid": 286877.2,
  "symbol": "FX_IDC:XAUINR",
  "exchange": "IDC"
}
```

### 2. MetalPriceAPI (New Fallback)
**Base URL**: `https://api.metalpriceapi.com/v1/`
**Authentication**: API Key in query parameters

#### Endpoints:
- **Symbols**: `symbols?api_key={key}`
- **Latest**: `latest?api_key={key}&base={base}&currencies={currencies}`
- **Historical**: `{YYYY-MM-DD}?api_key={key}&base={base}&currencies={currencies}`
- **Convert**: `convert?api_key={key}&from={from}&to={to}&amount={amount}`
- **Timeframe**: `timeframe?api_key={key}&start_date={start}&end_date={end}`
- **Change**: `change?api_key={key}&base={base}&start_date={start}&end_date={end}`
- **Carat**: `carat?api_key={key}`

#### Request Schema:
```json
{
  "method": "GET",
  "url": "https://api.metalpriceapi.com/v1/latest?api_key=6f36b6777c975becf41d8e19ded22645&base=INR&currencies=XAU,XAG,XPT,XPD",
  "headers": {}
}
```

#### Response Schema:
```json
{
  "success": true,
  "timestamp": 1642694400,
  "base": "INR",
  "rates": {
    "XAU": 0.0000134,
    "XAG": 0.0012456,
    "XPT": 0.0000892,
    "XPD": 0.0000456
  }
}
```

#### Historical Response Schema:
```json
{
  "success": true,
  "historical": true,
  "date": "2021-01-01",
  "timestamp": 1609459200,
  "base": "INR",
  "rates": {
    "XAU": 0.0000134,
    "XAG": 0.0012456
  }
}
```

## Data Mapping

### GoldAPI to Internal Format
- Direct mapping (1:1) - no transformation needed
- Already in our desired format

### MetalPriceAPI to Internal Format
- **Rate Conversion**: `1 / rate` to get INR price per ounce
- **Metal Symbol Mapping**: 
  - XAU → gold
  - XAG → silver  
  - XPT → platinum
  - XPD → palladium
- **Price Calculation**: 
  - `price = 1 / rate * troy_ounce_grams` 
  - `price_gram_24k = price / 31.1035`
- **Missing Fields**: Set defaults for change, changePercent, high, low, etc.

## Error Handling

### Common Error Responses:
```json
{
  "success": false,
  "error": {
    "code": "api_key_invalid",
    "message": "Invalid API key provided"
  }
}
```

### Error Codes:
- `api_key_invalid`: Invalid API key
- `rate_limit_exceeded`: API rate limit exceeded
- `currency_not_supported`: Currency not supported
- `network_error`: Network connection issues
- `timeout`: Request timeout

## Environment Configuration

### Environment Variables:
```bash
# Primary API Configuration
PRIMARY_API_PROVIDER=goldapi  # or metalpriceapi
GOLDAPI_KEY=your-goldapi-key-here
METALPRICEAPI_KEY=6f36b6777c975becf41d8e19ded22645

# API Settings
API_TIMEOUT=10000
API_RETRY_COUNT=3
API_RETRY_DELAY=1000

# Cache Settings
CACHE_TTL=300  # 5 minutes
```

## API Provider Switching Logic

1. **Primary API**: Defined by `PRIMARY_API_PROVIDER` env var
2. **Fallback Logic**: If primary fails, automatically switch to fallback
3. **Health Check**: Periodic health checks to switch back to primary when available
4. **Manual Override**: Admin can manually switch providers via API

## Rate Limiting

### GoldAPI:
- **Free Plan**: 100 requests/month
- **Paid Plan**: Varies by subscription

### MetalPriceAPI:
- **Free Plan**: 500 requests/month
- **Paid Plan**: Varies by subscription

## Caching Strategy

- **TTL**: 5 minutes for live prices
- **Historical**: 24 hours (historical data doesn't change)
- **Error Caching**: 1 minute for failed requests
- **Invalidation**: Manual invalidation available via API