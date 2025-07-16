// Enhanced service for fetching precious metals prices from GoldAPI.io
require('dotenv').config();
const { safeGet } = require('../config/axiosClient');

// Load environment variables directly to ensure they're available
const GOLD_API_KEY = process.env.GOLD_API_KEY;
const GOLD_API_BASE = process.env.GOLD_API_BASE;

const headers = { 'x-access-token': GOLD_API_KEY, 'Content-Type': 'application/json' };

// Cache for API responses to avoid rate limiting
const cache = new Map();
const CACHE_DURATION = 60000; // 1 minute cache

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 250; // 250ms between requests (4 requests per second max)

// Metal symbols mapping
const METALS = {
  gold: 'XAU',
  silver: 'XAG',
  platinum: 'XPT',
  palladium: 'XPD'
};

// Currency mapping
const CURRENCIES = {
  INR: 'INR',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP'
};

/**
 * Get live price for a specific metal in a specific currency
 * @param {string} metal - Metal symbol (XAU, XAG, XPT, XPD)
 * @param {string} currency - Currency code (INR, USD, EUR, GBP)
 * @returns {Promise<Object>} Price data object
 */
async function rateLimitedRequest(url, headers) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastRequestTime = Date.now();
  return await safeGet(url, { headers });
}

async function getMetalPrice(metal, currency = 'INR') {
  try {
    const cacheKey = `${metal}_${currency}`;
    const cached = cache.get(cacheKey);
    
    // Return cached data if it's still fresh
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log(`Returning cached data for ${cacheKey}`);
      return cached.data;
    }
    
    const url = `${GOLD_API_BASE}/${metal}/${currency}`;
    console.log('Fetching from URL:', url);
    
    const { data, error } = await rateLimitedRequest(url, headers);
    
    if (error) {
      console.error('API Error:', error);
      // Return cached data if available, even if stale
      if (cached) {
        console.log('Returning stale cached data due to API error');
        return cached.data;
      }
      return { error: error };
    }
    
    if (!data?.price) {
      console.error('No price data received:', data);
      return { error: 'No price data available' };
    }
    
    const result = {
      metal: metal,
      currency: currency,
      price: data.price,
      price_gram_24k: data.price_gram_24k || null,
      price_gram_22k: data.price_gram_22k || null,
      price_gram_18k: data.price_gram_18k || null,
      high: data.high_price || data.highPrice || null,
      low: data.low_price || data.lowPrice || null,
      open: data.open_price || data.openPrice || null,
      close: data.prev_close_price || data.prevClosePrice || null,
      change: data.ch || 0,
      changePercent: data.chp || 0,
      timestamp: data.timestamp || Date.now(),
      ask: data.ask || null,
      bid: data.bid || null,
      symbol: data.symbol || null,
      exchange: data.exchange || null
    };
    
    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  } catch (err) {
    console.error('getMetalPrice error:', err);
    return { error: err.message };
  }
}

/**
 * Get historical price for a specific metal on a specific date
 * @param {string} metal - Metal symbol (XAU, XAG, XPT, XPD)
 * @param {string} currency - Currency code (INR, USD, EUR, GBP)
 * @param {string} date - Date in YYYYMMDD format
 * @returns {Promise<Object>} Historical price data
 */
async function getHistoricalPrice(metal, currency = 'INR', date) {
  const { data, error } = await safeGet(`${GOLD_API_BASE}/${metal}/${currency}/${date}`, { headers });
  if (error || !data?.price) return { error: error || 'Historical data not available' };
  
  return {
    metal: metal,
    currency: currency,
    date: date,
    price: data.price,
    price_gram_24k: data.price_gram_24k || null,
    price_gram_22k: data.price_gram_22k || null,
    price_gram_18k: data.price_gram_18k || null,
    high: data.high_price || data.highPrice || null,
    low: data.low_price || data.lowPrice || null,
    open: data.open_price || data.openPrice || null,
    close: data.prev_close_price || data.prevClosePrice || null,
    change: data.ch || 0,
    changePercent: data.chp || 0,
    timestamp: data.timestamp || Date.now(),
    ask: data.ask || null,
    bid: data.bid || null,
    symbol: data.symbol || null,
    exchange: data.exchange || null
  };
}

/**
 * Get live prices for all metals
 * @param {string} currency - Currency code (INR, USD, EUR, GBP)
 * @returns {Promise<Object>} Object containing all metal prices
 */
async function getAllMetalPrices(currency = 'INR') {
  const prices = {};
  
  // Use sequential requests to avoid rate limiting
  for (const metalName of Object.keys(METALS)) {
    try {
      const metalSymbol = METALS[metalName];
      const priceData = await getMetalPrice(metalSymbol, currency);
      prices[metalName] = priceData;
    } catch (error) {
      console.error(`Error fetching ${metalName} price:`, error);
      prices[metalName] = { error: `Failed to fetch ${metalName} price` };
    }
  }

  return prices;
}

/**
 * Get API usage statistics
 * @returns {Promise<Object>} Usage statistics
 */
async function getAPIStats() {
  const { data, error } = await safeGet(`${GOLD_API_BASE}/stat`, { headers });
  if (error) return { error: error || 'Stats not available' };
  
  return {
    requests_made: data.requests_made || 0,
    requests_month: data.requests_month || 0,
    requests_limit: data.requests_limit || 100,
    requests_remaining: data.requests_remaining || 0,
    timestamp: Date.now()
  };
}

/**
 * Get price range for a specific period
 * @param {string} metal - Metal symbol (XAU, XAG, XPT, XPD)
 * @param {string} currency - Currency code (INR, USD, EUR, GBP)
 * @param {string} startDate - Start date in YYYYMMDD format
 * @param {string} endDate - End date in YYYYMMDD format
 * @returns {Promise<Array>} Array of historical price data
 */
async function getPriceRange(metal, currency = 'INR', startDate, endDate) {
  const prices = [];
  const start = new Date(startDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
  const end = new Date(endDate.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    try {
      const priceData = await getHistoricalPrice(metal, currency, dateStr);
      if (!priceData.error) {
        prices.push(priceData);
      }
    } catch (error) {
      console.error(`Error fetching price for ${dateStr}:`, error);
    }
  }
  
  return prices;
}

// Legacy function for backward compatibility
async function getGoldApiLivePrice() {
  return await getMetalPrice('XAU', 'INR');
}

module.exports = {
  getGoldApiLivePrice,
  getMetalPrice,
  getHistoricalPrice,
  getAllMetalPrices,
  getAPIStats,
  getPriceRange,
  METALS,
  CURRENCIES
};
