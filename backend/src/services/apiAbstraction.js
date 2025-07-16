// API Abstraction Layer for Metal Price APIs
const axios = require('axios');
const dotenv = require('dotenv');
const { 
  METAL_SYMBOLS, 
  CURRENCY_CODES, 
  APIMappingConfig, 
  TransformationRules 
} = require('../schemas/apiSchemas');
const dataService = require('./dataService');

dotenv.config();

// Constants
const TROY_OUNCE_GRAMS = 31.1035;
const SUPPORTED_METALS = ['XAU', 'XAG', 'XPT', 'XPD'];
const METAL_NAMES = {
  'XAU': 'gold',
  'XAG': 'silver', 
  'XPT': 'platinum',
  'XPD': 'palladium'
};

// API Configuration
const API_CONFIGS = {
  goldapi: {
    baseUrl: 'https://www.goldapi.io/api',
    apiKey: process.env.GOLDAPI_KEY,
    timeout: parseInt(process.env.API_TIMEOUT) || 10000,
    headers: {
      'x-access-token': process.env.GOLDAPI_KEY
    }
  },
  metalpriceapi: {
    baseUrl: 'https://api.metalpriceapi.com/v1',
    apiKey: process.env.METALPRICEAPI_KEY || '',
    timeout: parseInt(process.env.API_TIMEOUT) || 10000,
    headers: {}
  }
};

// Get primary and fallback providers
const PRIMARY_PROVIDER = process.env.PRIMARY_API_PROVIDER || 'metalpriceapi';
const FALLBACK_PROVIDER = PRIMARY_PROVIDER === 'goldapi' ? 'metalpriceapi' : 'goldapi';
const DB_ONLY_MODE = PRIMARY_PROVIDER === 'db';

// Debug logging
console.log('🏗️  Feature Flag - API Provider:', PRIMARY_PROVIDER);
console.log('🏗️  DB-only mode:', DB_ONLY_MODE);

/**
 * Standard internal data structure for metal prices
 */
const createStandardResponse = (success, data = null, error = null) => ({
  success,
  timestamp: new Date().toISOString(),
  data,
  error
});

/**
 * GoldAPI Data Mapper with Schema-Based Transformation
 */
class GoldAPIMapper {
  static async fetchLivePrice(metal, currency = 'INR') {
    const config = API_CONFIGS.goldapi;
    const url = `${config.baseUrl}/${metal}/${currency}`;
    
    // Add debug logging to track API calls
    console.log(`🌐 GoldAPI: Making API call to ${url}`);
    console.log(`🌐 DB_ONLY_MODE status: ${DB_ONLY_MODE}`);
    
    try {
      const response = await axios.get(url, {
        headers: config.headers,
        timeout: config.timeout
      });
      
      // Use schema-based transformation
      return TransformationRules.goldapi.transformToStandard(response.data);
    } catch (error) {
      throw new Error(`GoldAPI Error: ${error.message}`);
    }
  }

  static async fetchHistoricalPrice(metal, currency = 'INR', date) {
    const config = API_CONFIGS.goldapi;
    const url = `${config.baseUrl}/${metal}/${currency}/${date}`;
    
    try {
      const response = await axios.get(url, {
        headers: config.headers,
        timeout: config.timeout
      });
      
      // Use schema-based transformation
      return TransformationRules.goldapi.transformToStandard(response.data);
    } catch (error) {
      throw new Error(`GoldAPI Historical Error: ${error.message}`);
    }
  }
}

/**
 * MetalPriceAPI Data Mapper with Schema-Based Transformation
 */
class MetalPriceAPIMapper {
  static async fetchLivePrice(metal, currency = 'INR') {
    const config = API_CONFIGS.metalpriceapi;
    const url = `${config.baseUrl}/latest`;
    
    // Add debug logging to track API calls
    console.log(`🌐 MetalPriceAPI: Making API call to ${url}`);
    console.log(`🌐 DB_ONLY_MODE status: ${DB_ONLY_MODE}`);
    
    try {
      const response = await axios.get(url, {
        params: {
          api_key: config.apiKey,
          base: currency,
          currencies: metal
        },
        timeout: config.timeout
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'API request failed');
      }
      
      // Use schema-based transformation
      return TransformationRules.metalpriceapi.transformToStandard(response.data, metal, currency);
    } catch (error) {
      throw new Error(`MetalPriceAPI Error: ${error.message}`);
    }
  }

  static async fetchHistoricalPrice(metal, currency = 'INR', date) {
    const config = API_CONFIGS.metalpriceapi;
    const url = `${config.baseUrl}/${date}`;
    
    try {
      const response = await axios.get(url, {
        params: {
          api_key: config.apiKey,
          base: currency,
          currencies: metal
        },
        timeout: config.timeout
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'API request failed');
      }
      
      // Use schema-based transformation
      return TransformationRules.metalpriceapi.transformToStandard(response.data, metal, currency);
    } catch (error) {
      throw new Error(`MetalPriceAPI Historical Error: ${error.message}`);
    }
  }

  static async fetchAllLivePrices(currency = 'INR') {
    const config = API_CONFIGS.metalpriceapi;
    const url = `${config.baseUrl}/latest`;
    
    try {
      const response = await axios.get(url, {
        params: {
          api_key: config.apiKey,
          base: currency,
          currencies: SUPPORTED_METALS.join(',')
        },
        timeout: config.timeout
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'API request failed');
      }
      
      const results = {};
      for (const metal of SUPPORTED_METALS) {
        if (response.data.rates[metal]) {
          results[METAL_NAMES[metal]] = TransformationRules.metalpriceapi.transformToStandard(response.data, metal, currency);
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`MetalPriceAPI All Prices Error: ${error.message}`);
    }
  }

  // Additional endpoints for MetalPriceAPI features
  static async fetchConvertPrice(from, to, amount) {
    const config = API_CONFIGS.metalpriceapi;
    const url = `${config.baseUrl}/convert`;
    
    try {
      const response = await axios.get(url, {
        params: {
          api_key: config.apiKey,
          from,
          to,
          amount
        },
        timeout: config.timeout
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'API request failed');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`MetalPriceAPI Convert Error: ${error.message}`);
    }
  }

  static async fetchTimeframeData(startDate, endDate, base = 'INR', currencies = 'XAU,XAG,XPT,XPD') {
    const config = API_CONFIGS.metalpriceapi;
    const url = `${config.baseUrl}/timeframe`;
    
    try {
      const response = await axios.get(url, {
        params: {
          api_key: config.apiKey,
          start_date: startDate,
          end_date: endDate,
          base,
          currencies
        },
        timeout: config.timeout
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'API request failed');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`MetalPriceAPI Timeframe Error: ${error.message}`);
    }
  }

  static async fetchChangeData(base = 'INR', startDate, endDate, currencies = 'XAU,XAG,XPT,XPD') {
    const config = API_CONFIGS.metalpriceapi;
    const url = `${config.baseUrl}/change`;
    
    try {
      const response = await axios.get(url, {
        params: {
          api_key: config.apiKey,
          base,
          start_date: startDate,
          end_date: endDate,
          currencies
        },
        timeout: config.timeout
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'API request failed');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`MetalPriceAPI Change Error: ${error.message}`);
    }
  }

  static async fetchCaratData() {
    const config = API_CONFIGS.metalpriceapi;
    const url = `${config.baseUrl}/carat`;
    
    try {
      const response = await axios.get(url, {
        params: {
          api_key: config.apiKey
        },
        timeout: config.timeout
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'API request failed');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`MetalPriceAPI Carat Error: ${error.message}`);
    }
  }

  static async fetchSymbols() {
    const config = API_CONFIGS.metalpriceapi;
    const url = `${config.baseUrl}/symbols`;
    
    try {
      const response = await axios.get(url, {
        params: {
          api_key: config.apiKey
        },
        timeout: config.timeout
      });
      
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'API request failed');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`MetalPriceAPI Symbols Error: ${error.message}`);
    }
  }
}

/**
 * Main API Abstraction Service
 */
class MetalPriceService {
  constructor() {
    this.primaryProvider = PRIMARY_PROVIDER;
    this.fallbackProvider = FALLBACK_PROVIDER;
    this.retryCount = parseInt(process.env.API_RETRY_COUNT) || 3;
    this.retryDelay = parseInt(process.env.API_RETRY_DELAY) || 1000;
  }

  /**
   * Get mapper instance for given provider
   */
  getMapper(provider) {
    switch (provider) {
      case 'goldapi':
        return GoldAPIMapper;
      case 'metalpriceapi':
        return MetalPriceAPIMapper;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  async retry(fn, retries = this.retryCount) {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }
      
      console.log(`API call failed, retrying in ${this.retryDelay}ms. Retries left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      return this.retry(fn, retries - 1);
    }
  }

  /**
   * Fetch live price with database fallback
   */
  async getLivePrice(metal, currency = 'INR') {
    const startTime = Date.now();
    
    // If in DB-only mode, skip API calls entirely
    if (DB_ONLY_MODE) {
      console.log(`🏦 DB-only mode: Fetching ${metal}/${currency} from database`);
      const dbData = await dataService.getLatestPriceFromDB(metal, currency);
      if (dbData) {
        return createStandardResponse(true, dbData);
      } else {
        return createStandardResponse(false, null, {
          message: `No data found in database for ${metal}/${currency}`
        });
      }
    }
    
    // Check if cached data is valid first
    const isCacheValid = await dataService.isCacheValid(metal, currency, false);
    if (isCacheValid) {
      const cachedData = await dataService.getLatestPriceFromDB(metal, currency);
      if (cachedData) {
        console.log(`📦 Using cached data for ${metal}/${currency}`);
        return createStandardResponse(true, cachedData);
      }
    }

    try {
      // Try primary provider
      const primaryMapper = this.getMapper(this.primaryProvider);
      const result = await this.retry(() => primaryMapper.fetchLivePrice(metal, currency));
      
      // Save to database for future fallback
      await dataService.savePriceData(result, this.primaryProvider);
      
      // Log successful API call
      await dataService.logAPICall(
        this.primaryProvider,
        'fetchLivePrice',
        'GET',
        { metal, currency },
        result,
        200,
        true,
        Date.now() - startTime
      );
      
      return createStandardResponse(true, result);
    } catch (primaryError) {
      console.error(`Primary API (${this.primaryProvider}) failed:`, primaryError.message);
      
      // Log failed primary API call
      await dataService.logAPICall(
        this.primaryProvider,
        'fetchLivePrice',
        'GET',
        { metal, currency },
        null,
        null,
        false,
        Date.now() - startTime,
        primaryError.message
      );
      
      try {
        // Try fallback provider
        const fallbackMapper = this.getMapper(this.fallbackProvider);
        const result = await this.retry(() => fallbackMapper.fetchLivePrice(metal, currency));
        
        // Save to database
        await dataService.savePriceData(result, this.fallbackProvider);
        
        // Log successful fallback API call
        await dataService.logAPICall(
          this.fallbackProvider,
          'fetchLivePrice',
          'GET',
          { metal, currency },
          result,
          200,
          true,
          Date.now() - startTime
        );
        
        return createStandardResponse(true, result);
      } catch (fallbackError) {
        console.error(`Fallback API (${this.fallbackProvider}) failed:`, fallbackError.message);
        
        // Log failed fallback API call
        await dataService.logAPICall(
          this.fallbackProvider,
          'fetchLivePrice',
          'GET',
          { metal, currency },
          null,
          null,
          false,
          Date.now() - startTime,
          fallbackError.message
        );
        
        // Try database fallback
        const dbData = await dataService.getLatestPriceFromDB(metal, currency);
        if (dbData) {
          console.log(`🏦 Using database fallback for ${metal}/${currency}`);
          return createStandardResponse(true, dbData);
        }
        
        return createStandardResponse(false, null, {
          message: 'All providers failed including database fallback',
          primaryError: primaryError.message,
          fallbackError: fallbackError.message
        });
      }
    }
  }

  /**
   * Fetch historical price with database fallback
   */
  async getHistoricalPrice(metal, currency = 'INR', date) {
    const startTime = Date.now();
    
    // If in DB-only mode, skip API calls entirely
    if (DB_ONLY_MODE) {
      console.log(`🏦 DB-only mode: Fetching historical ${metal}/${currency} for ${date} from database`);
      const dbData = await dataService.getHistoricalPriceFromDB(metal, currency, date);
      if (dbData) {
        return createStandardResponse(true, dbData);
      } else {
        return createStandardResponse(false, null, {
          message: `No historical data found in database for ${metal}/${currency} on ${date}`
        });
      }
    }
    
    // Check database first for historical data
    const dbData = await dataService.getHistoricalPriceFromDB(metal, currency, date);
    if (dbData) {
      console.log(`📦 Using cached historical data for ${metal}/${currency} on ${date}`);
      return createStandardResponse(true, dbData);
    }

    try {
      // Try primary provider
      const primaryMapper = this.getMapper(this.primaryProvider);
      const result = await this.retry(() => primaryMapper.fetchHistoricalPrice(metal, currency, date));
      
      // Save to database for future use
      await dataService.saveHistoricalPriceData(result, this.primaryProvider, date);
      
      // Log successful API call
      await dataService.logAPICall(
        this.primaryProvider,
        'fetchHistoricalPrice',
        'GET',
        { metal, currency, date },
        result,
        200,
        true,
        Date.now() - startTime
      );
      
      return createStandardResponse(true, result);
    } catch (primaryError) {
      console.error(`Primary API (${this.primaryProvider}) failed:`, primaryError.message);
      
      // Log failed primary API call
      await dataService.logAPICall(
        this.primaryProvider,
        'fetchHistoricalPrice',
        'GET',
        { metal, currency, date },
        null,
        null,
        false,
        Date.now() - startTime,
        primaryError.message
      );
      
      try {
        // Try fallback provider
        const fallbackMapper = this.getMapper(this.fallbackProvider);
        const result = await this.retry(() => fallbackMapper.fetchHistoricalPrice(metal, currency, date));
        
        // Save to database
        await dataService.saveHistoricalPriceData(result, this.fallbackProvider, date);
        
        // Log successful fallback API call
        await dataService.logAPICall(
          this.fallbackProvider,
          'fetchHistoricalPrice',
          'GET',
          { metal, currency, date },
          result,
          200,
          true,
          Date.now() - startTime
        );
        
        return createStandardResponse(true, result);
      } catch (fallbackError) {
        console.error(`Fallback API (${this.fallbackProvider}) failed:`, fallbackError.message);
        
        // Log failed fallback API call
        await dataService.logAPICall(
          this.fallbackProvider,
          'fetchHistoricalPrice',
          'GET',
          { metal, currency, date },
          null,
          null,
          false,
          Date.now() - startTime,
          fallbackError.message
        );
        
        return createStandardResponse(false, null, {
          message: 'Both primary and fallback APIs failed',
          primaryError: primaryError.message,
          fallbackError: fallbackError.message
        });
      }
    }
  }

  /**
   * Fetch all live prices with database fallback
   */
  async getAllLivePrices(currency = 'INR') {
    const startTime = Date.now();
    
    // If in DB-only mode, skip API calls entirely
    if (DB_ONLY_MODE) {
      console.log(`🏦 DB-only mode: Fetching all metals/${currency} from database`);
      const dbData = await dataService.getAllLatestPricesFromDB(currency);
      if (dbData && Object.keys(dbData).length > 0) {
        return createStandardResponse(true, dbData);
      } else {
        return createStandardResponse(false, null, {
          message: `No data found in database for currency ${currency}`
        });
      }
    }
    
    // Check if cached data is valid first
    const isCacheValid = await dataService.isCacheValid('XAU', currency, false);
    if (isCacheValid) {
      const cachedData = await dataService.getAllLatestPricesFromDB(currency);
      if (cachedData && Object.keys(cachedData).length >= 2) {
        console.log(`📦 Using cached data for all metals/${currency}`);
        return createStandardResponse(true, cachedData);
      }
    }

    try {
      // If primary is MetalPriceAPI, use batch endpoint
      if (this.primaryProvider === 'metalpriceapi') {
        const mapper = this.getMapper('metalpriceapi');
        const result = await this.retry(() => mapper.fetchAllLivePrices(currency));
        
        // Save each metal price to database
        for (const metalName in result) {
          if (result[metalName]) {
            await dataService.savePriceData(result[metalName], this.primaryProvider);
          }
        }
        
        // Log successful API call
        await dataService.logAPICall(
          this.primaryProvider,
          'fetchAllLivePrices',
          'GET',
          { currency },
          result,
          200,
          true,
          Date.now() - startTime
        );
        
        return createStandardResponse(true, result);
      }
      
      // Otherwise, fetch individual prices
      const results = {};
      for (const metal of SUPPORTED_METALS) {
        try {
          const response = await this.getLivePrice(metal, currency);
          if (response.success) {
            results[METAL_NAMES[metal]] = response.data;
          }
        } catch (error) {
          console.error(`Failed to fetch ${metal} price:`, error.message);
        }
      }
      
      return createStandardResponse(true, results);
    } catch (error) {
      console.error('All APIs failed, trying database fallback');
      
      // Try database fallback
      const dbData = await dataService.getAllLatestPricesFromDB(currency);
      if (dbData && Object.keys(dbData).length > 0) {
        console.log(`🏦 Using database fallback for all metals/${currency}`);
        return createStandardResponse(true, dbData);
      }
      
      return createStandardResponse(false, null, {
        message: 'Failed to fetch all live prices from APIs and database',
        error: error.message
      });
    }
  }

  /**
   * Health check for API providers
   */
  async healthCheck(provider) {
    try {
      const mapper = this.getMapper(provider);
      await mapper.fetchLivePrice('XAU', 'INR');
      return { provider, status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { 
        provider, 
        status: 'unhealthy', 
        error: error.message,
        timestamp: new Date().toISOString() 
      };
    }
  }

  /**
   * Switch primary provider
   */
  switchProvider(newProvider) {
    if (newProvider === 'db') {
      this.primaryProvider = 'db';
      this.fallbackProvider = null;
      console.log('Switched to DB-only mode - no API calls will be made');
    } else if (!API_CONFIGS[newProvider]) {
      throw new Error(`Unsupported provider: ${newProvider}`);
    } else {
      this.primaryProvider = newProvider;
      this.fallbackProvider = newProvider === 'goldapi' ? 'metalpriceapi' : 'goldapi';
      console.log(`Switched to primary provider: ${newProvider}, fallback: ${this.fallbackProvider}`);
    }
  }

  /**
   * Additional MetalPriceAPI-specific methods
   */
  async convertPrice(from, to, amount) {
    try {
      if (this.primaryProvider === 'metalpriceapi') {
        const mapper = this.getMapper('metalpriceapi');
        const result = await this.retry(() => mapper.fetchConvertPrice(from, to, amount));
        return createStandardResponse(true, result);
      } else {
        throw new Error('Convert functionality only available with MetalPriceAPI');
      }
    } catch (error) {
      return createStandardResponse(false, null, {
        message: 'Failed to convert price',
        error: error.message
      });
    }
  }

  async getTimeframeData(startDate, endDate, base = 'INR', currencies = 'XAU,XAG,XPT,XPD') {
    try {
      if (this.primaryProvider === 'metalpriceapi') {
        const mapper = this.getMapper('metalpriceapi');
        const result = await this.retry(() => mapper.fetchTimeframeData(startDate, endDate, base, currencies));
        return createStandardResponse(true, result);
      } else {
        throw new Error('Timeframe functionality only available with MetalPriceAPI');
      }
    } catch (error) {
      return createStandardResponse(false, null, {
        message: 'Failed to get timeframe data',
        error: error.message
      });
    }
  }

  async getChangeData(base = 'INR', startDate, endDate, currencies = 'XAU,XAG,XPT,XPD') {
    try {
      if (this.primaryProvider === 'metalpriceapi') {
        const mapper = this.getMapper('metalpriceapi');
        const result = await this.retry(() => mapper.fetchChangeData(base, startDate, endDate, currencies));
        return createStandardResponse(true, result);
      } else {
        throw new Error('Change data functionality only available with MetalPriceAPI');
      }
    } catch (error) {
      return createStandardResponse(false, null, {
        message: 'Failed to get change data',
        error: error.message
      });
    }
  }

  async getCaratData() {
    try {
      if (this.primaryProvider === 'metalpriceapi') {
        const mapper = this.getMapper('metalpriceapi');
        const result = await this.retry(() => mapper.fetchCaratData());
        return createStandardResponse(true, result);
      } else {
        throw new Error('Carat data functionality only available with MetalPriceAPI');
      }
    } catch (error) {
      return createStandardResponse(false, null, {
        message: 'Failed to get carat data',
        error: error.message
      });
    }
  }

  async getSymbols() {
    try {
      if (this.primaryProvider === 'metalpriceapi') {
        const mapper = this.getMapper('metalpriceapi');
        const result = await this.retry(() => mapper.fetchSymbols());
        return createStandardResponse(true, result);
      } else {
        throw new Error('Symbols functionality only available with MetalPriceAPI');
      }
    } catch (error) {
      return createStandardResponse(false, null, {
        message: 'Failed to get symbols',
        error: error.message
      });
    }
  }

  /**
   * Get API statistics
   */
  async getAPIStats(provider = null, hoursAgo = 24) {
    try {
      const stats = await dataService.getAPIStats(provider, hoursAgo);
      return createStandardResponse(true, stats);
    } catch (error) {
      return createStandardResponse(false, null, {
        message: 'Failed to get API statistics',
        error: error.message
      });
    }
  }

  /**
   * Clean old data
   */
  async cleanOldData(daysToKeep = 30) {
    try {
      const result = await dataService.cleanOldData(daysToKeep);
      return createStandardResponse(true, { cleaned: result });
    } catch (error) {
      return createStandardResponse(false, null, {
        message: 'Failed to clean old data',
        error: error.message
      });
    }
  }
}

// Export singleton instance
module.exports = new MetalPriceService();