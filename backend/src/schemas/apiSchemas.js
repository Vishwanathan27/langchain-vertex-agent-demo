// JSON Schema definitions for API request/response mapping

/**
 * Standard Metal Symbols
 */
const METAL_SYMBOLS = {
  XAU: 'gold',
  XAG: 'silver',
  XPT: 'platinum',
  XPD: 'palladium'
};

/**
 * Standard Currency Codes
 */
const CURRENCY_CODES = {
  INR: 'Indian Rupee',
  USD: 'US Dollar',
  EUR: 'Euro'
};

/**
 * MetalPriceAPI Schemas
 */
const MetalPriceAPISchemas = {
  // Request parameters schema
  latestRequest: {
    type: 'object',
    properties: {
      api_key: { type: 'string' },
      base: { type: 'string', enum: Object.keys(CURRENCY_CODES) },
      currencies: { type: 'string' }
    },
    required: ['api_key', 'base', 'currencies']
  },

  // Response schema for latest prices
  latestResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      timestamp: { type: 'number' },
      base: { type: 'string' },
      rates: {
        type: 'object',
        properties: {
          XAU: { type: 'number' },
          XAG: { type: 'number' },
          XPT: { type: 'number' },
          XPD: { type: 'number' }
        }
      }
    },
    required: ['success', 'timestamp', 'base', 'rates']
  },

  // Historical data request schema
  historicalRequest: {
    type: 'object',
    properties: {
      api_key: { type: 'string' },
      base: { type: 'string', enum: Object.keys(CURRENCY_CODES) },
      currencies: { type: 'string' },
      date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }
    },
    required: ['api_key', 'base', 'currencies', 'date']
  },

  // Historical data response schema
  historicalResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      historical: { type: 'boolean' },
      date: { type: 'string' },
      timestamp: { type: 'number' },
      base: { type: 'string' },
      rates: {
        type: 'object',
        properties: {
          XAU: { type: 'number' },
          XAG: { type: 'number' },
          XPT: { type: 'number' },
          XPD: { type: 'number' }
        }
      }
    },
    required: ['success', 'date', 'timestamp', 'base', 'rates']
  },

  // Convert request schema
  convertRequest: {
    type: 'object',
    properties: {
      api_key: { type: 'string' },
      from: { type: 'string' },
      to: { type: 'string' },
      amount: { type: 'number' }
    },
    required: ['api_key', 'from', 'to', 'amount']
  },

  // Convert response schema
  convertResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      query: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string' },
          amount: { type: 'number' }
        }
      },
      info: {
        type: 'object',
        properties: {
          timestamp: { type: 'number' },
          rate: { type: 'number' }
        }
      },
      result: { type: 'number' }
    },
    required: ['success', 'query', 'info', 'result']
  },

  // Error response schema
  errorResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', enum: [false] },
      error: {
        type: 'object',
        properties: {
          code: { type: 'number' },
          message: { type: 'string' }
        },
        required: ['code', 'message']
      }
    },
    required: ['success', 'error']
  }
};

/**
 * GoldAPI Schemas
 */
const GoldAPISchemas = {
  // Live price response schema
  liveResponse: {
    type: 'object',
    properties: {
      metal: { type: 'string', enum: Object.keys(METAL_SYMBOLS) },
      currency: { type: 'string', enum: Object.keys(CURRENCY_CODES) },
      price: { type: 'number' },
      price_gram_24k: { type: 'number' },
      price_gram_22k: { type: 'number' },
      price_gram_18k: { type: 'number' },
      high: { type: 'number' },
      low: { type: 'number' },
      open: { type: 'number' },
      close: { type: 'number' },
      change: { type: 'number' },
      changePercent: { type: 'number' },
      timestamp: { type: 'number' },
      ask: { type: 'number' },
      bid: { type: 'number' },
      symbol: { type: 'string' },
      exchange: { type: 'string' }
    },
    required: ['metal', 'currency', 'price', 'timestamp']
  }
};

/**
 * Standard Internal Response Schema
 */
const StandardResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    timestamp: { type: 'string', format: 'date-time' },
    data: {
      type: 'object',
      properties: {
        metal: { type: 'string' },
        currency: { type: 'string' },
        price: { type: 'number' },
        price_gram_24k: { type: ['number', 'null'] },
        price_gram_22k: { type: ['number', 'null'] },
        price_gram_18k: { type: ['number', 'null'] },
        high: { type: ['number', 'null'] },
        low: { type: ['number', 'null'] },
        open: { type: ['number', 'null'] },
        close: { type: ['number', 'null'] },
        change: { type: ['number', 'null'] },
        changePercent: { type: ['number', 'null'] },
        timestamp: { type: 'number' },
        ask: { type: ['number', 'null'] },
        bid: { type: ['number', 'null'] },
        symbol: { type: 'string' },
        exchange: { type: 'string' }
      },
      required: ['metal', 'currency', 'price', 'timestamp', 'symbol', 'exchange']
    },
    error: { type: ['object', 'null'] }
  },
  required: ['success', 'timestamp']
};

/**
 * Standard Error Response Schema
 */
const StandardErrorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', enum: [false] },
    timestamp: { type: 'string', format: 'date-time' },
    data: { type: 'null' },
    error: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        primaryError: { type: 'string' },
        fallbackError: { type: 'string' }
      },
      required: ['message']
    }
  },
  required: ['success', 'timestamp', 'data', 'error']
};

/**
 * API Configuration Schema
 */
const APIConfigSchema = {
  type: 'object',
  properties: {
    baseUrl: { type: 'string', format: 'uri' },
    apiKey: { type: 'string' },
    timeout: { type: 'number', minimum: 1000, maximum: 60000 },
    headers: { type: 'object' },
    retryCount: { type: 'number', minimum: 0, maximum: 10 },
    retryDelay: { type: 'number', minimum: 100, maximum: 10000 }
  },
  required: ['baseUrl', 'apiKey', 'timeout']
};

/**
 * Request/Response Mapping Configuration
 */
const APIMappingConfig = {
  metalpriceapi: {
    endpoints: {
      latest: {
        url: '/latest',
        method: 'GET',
        requestSchema: MetalPriceAPISchemas.latestRequest,
        responseSchema: MetalPriceAPISchemas.latestResponse,
        errorSchema: MetalPriceAPISchemas.errorResponse
      },
      historical: {
        url: '/{date}',
        method: 'GET',
        requestSchema: MetalPriceAPISchemas.historicalRequest,
        responseSchema: MetalPriceAPISchemas.historicalResponse,
        errorSchema: MetalPriceAPISchemas.errorResponse
      },
      convert: {
        url: '/convert',
        method: 'GET',
        requestSchema: MetalPriceAPISchemas.convertRequest,
        responseSchema: MetalPriceAPISchemas.convertResponse,
        errorSchema: MetalPriceAPISchemas.errorResponse
      },
      symbols: {
        url: '/symbols',
        method: 'GET',
        requestSchema: { type: 'object', properties: { api_key: { type: 'string' } } },
        responseSchema: { type: 'object' }
      },
      timeframe: {
        url: '/timeframe',
        method: 'GET',
        requestSchema: {
          type: 'object',
          properties: {
            api_key: { type: 'string' },
            start_date: { type: 'string' },
            end_date: { type: 'string' },
            base: { type: 'string' },
            currencies: { type: 'string' }
          }
        }
      },
      change: {
        url: '/change',
        method: 'GET',
        requestSchema: {
          type: 'object',
          properties: {
            api_key: { type: 'string' },
            base: { type: 'string' },
            start_date: { type: 'string' },
            end_date: { type: 'string' },
            currencies: { type: 'string' }
          }
        }
      },
      carat: {
        url: '/carat',
        method: 'GET',
        requestSchema: { type: 'object', properties: { api_key: { type: 'string' } } }
      }
    }
  },
  goldapi: {
    endpoints: {
      live: {
        url: '/{metal}/{currency}',
        method: 'GET',
        requestSchema: { type: 'object' },
        responseSchema: GoldAPISchemas.liveResponse
      },
      historical: {
        url: '/{metal}/{currency}/{date}',
        method: 'GET',
        requestSchema: { type: 'object' },
        responseSchema: GoldAPISchemas.liveResponse
      }
    }
  }
};

/**
 * Data Transformation Rules
 */
const TransformationRules = {
  metalpriceapi: {
    // Transform MetalPriceAPI response to standard format
    transformToStandard: (response, metal, currency) => {
      const rate = response.rates[metal];
      if (!rate) {
        throw new Error(`No rate found for metal: ${metal}`);
      }

      const TROY_OUNCE_GRAMS = 31.1035;
      const pricePerOunce = 1 / rate;
      const pricePerGram = pricePerOunce / TROY_OUNCE_GRAMS;

      return {
        metal,
        currency,
        price: pricePerOunce,
        price_gram_24k: metal === 'XAU' ? pricePerGram : null,
        price_gram_22k: metal === 'XAU' ? pricePerGram * 0.917 : null,
        price_gram_18k: metal === 'XAU' ? pricePerGram * 0.750 : null,
        high: null,
        low: null,
        open: null,
        close: null,
        change: null,
        changePercent: null,
        timestamp: response.timestamp,
        ask: null,
        bid: null,
        symbol: `${metal}${currency}`,
        exchange: 'MetalPriceAPI'
      };
    }
  },
  goldapi: {
    // Transform GoldAPI response to standard format
    transformToStandard: (response) => {
      return {
        metal: response.metal,
        currency: response.currency,
        price: response.price,
        price_gram_24k: response.price_gram_24k,
        price_gram_22k: response.price_gram_22k,
        price_gram_18k: response.price_gram_18k,
        high: response.high,
        low: response.low,
        open: response.open,
        close: response.close,
        change: response.change,
        changePercent: response.changePercent,
        timestamp: response.timestamp,
        ask: response.ask,
        bid: response.bid,
        symbol: response.symbol,
        exchange: response.exchange
      };
    }
  }
};

module.exports = {
  METAL_SYMBOLS,
  CURRENCY_CODES,
  MetalPriceAPISchemas,
  GoldAPISchemas,
  StandardResponseSchema,
  StandardErrorSchema,
  APIConfigSchema,
  APIMappingConfig,
  TransformationRules
};