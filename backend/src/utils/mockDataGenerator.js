// Mock data generator for precious metals when in DB-only mode
const db = require('../db/connection');

const METALS = {
  XAU: { name: 'Gold', basePrice: 72000, volatility: 0.02 },
  XAG: { name: 'Silver', basePrice: 3300, volatility: 0.03 },
  XPT: { name: 'Platinum', basePrice: 121000, volatility: 0.025 },
  XPD: { name: 'Palladium', basePrice: 107000, volatility: 0.04 }
};

const TROY_OUNCE_GRAMS = 31.1035;

/**
 * Generate realistic mock price data for a metal
 */
function generateMockPriceData(metal, currency = 'INR') {
  const config = METALS[metal];
  if (!config) {
    throw new Error(`Unsupported metal: ${metal}`);
  }
  
  const basePrice = config.basePrice;
  const volatility = config.volatility;
  
  // Generate price with some randomness
  const randomFactor = 1 + (Math.random() - 0.5) * 2 * volatility;
  const price = basePrice * randomFactor;
  
  // Generate change data
  const changePercent = (Math.random() - 0.5) * 6; // -3% to +3%
  const change = price * (changePercent / 100);
  
  // Generate high/low based on current price
  const high = price * (1 + Math.random() * 0.02);
  const low = price * (1 - Math.random() * 0.02);
  
  // Calculate per-ounce price
  const perOuncePrice = price / TROY_OUNCE_GRAMS;
  
  // Calculate different karat prices for gold
  const priceGram24k = price;
  const priceGram22k = price * 0.9167; // 22k is 91.67% pure
  const priceGram18k = price * 0.75;   // 18k is 75% pure
  
  return {
    metal,
    currency,
    price: parseFloat(price.toFixed(6)),
    change: parseFloat(change.toFixed(6)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    high: parseFloat(high.toFixed(6)),
    low: parseFloat(low.toFixed(6)),
    open: parseFloat((price - change).toFixed(6)),
    close: parseFloat(price.toFixed(6)),
    volume: Math.floor(Math.random() * 10000) + 1000,
    per_ounce_price: parseFloat(perOuncePrice.toFixed(6)),
    price_gram_24k: parseFloat(priceGram24k.toFixed(6)),
    price_gram_22k: parseFloat(priceGram22k.toFixed(6)),
    price_gram_18k: parseFloat(priceGram18k.toFixed(6)),
    provider: 'mock',
    timestamp: new Date().toISOString()
  };
}

/**
 * Save mock data to database
 */
async function saveMockDataToDB(mockData) {
  try {
    const result = await db('metal_prices').insert({
      metal: mockData.metal,
      currency: mockData.currency,
      price: mockData.price,
      change: mockData.change,
      change_percent: mockData.changePercent,
      high: mockData.high,
      low: mockData.low,
      open: mockData.open,
      close: mockData.close,
      volume: mockData.volume,
      per_ounce_price: mockData.per_ounce_price,
      price_gram_24k: mockData.price_gram_24k,
      price_gram_22k: mockData.price_gram_22k,
      price_gram_18k: mockData.price_gram_18k,
      provider: mockData.provider,
      raw_response: JSON.stringify(mockData),
      created_at: new Date()
    }).returning('*');
    
    return result[0];
  } catch (error) {
    console.error('Error saving mock data to database:', error);
    throw error;
  }
}

/**
 * Generate and save mock data for all metals
 */
async function generateAllMockData(currency = 'INR') {
  const results = {};
  
  for (const metal of Object.keys(METALS)) {
    try {
      const mockData = generateMockPriceData(metal, currency);
      const savedData = await saveMockDataToDB(mockData);
      results[METALS[metal].name.toLowerCase()] = mockData;
      console.log(`✅ Generated mock data for ${METALS[metal].name} (${metal})`);
    } catch (error) {
      console.error(`❌ Failed to generate mock data for ${metal}:`, error);
    }
  }
  
  return results;
}

/**
 * Update existing data with slight variations (for real-time updates)
 */
async function updateMockData(metal, currency = 'INR') {
  try {
    // Get the last price from database
    const lastPrice = await db('metal_prices')
      .where({ metal, currency })
      .orderBy('created_at', 'desc')
      .first();
    
    if (!lastPrice) {
      // If no previous data, generate fresh mock data
      return generateMockPriceData(metal, currency);
    }
    
    // Generate small variation from last price
    const config = METALS[metal];
    const volatility = config.volatility * 0.3; // Smaller changes for updates
    
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * volatility;
    const newPrice = lastPrice.price * randomFactor;
    
    // Calculate change from last price
    const change = newPrice - lastPrice.price;
    const changePercent = (change / lastPrice.price) * 100;
    
    // Update high/low if needed
    const high = Math.max(lastPrice.high, newPrice);
    const low = Math.min(lastPrice.low, newPrice);
    
    // Calculate per-ounce price
    const perOuncePrice = newPrice / TROY_OUNCE_GRAMS;
    
    // Calculate different karat prices
    const priceGram24k = newPrice;
    const priceGram22k = newPrice * 0.9167;
    const priceGram18k = newPrice * 0.75;
    
    return {
      metal,
      currency,
      price: parseFloat(newPrice.toFixed(6)),
      change: parseFloat(change.toFixed(6)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      high: parseFloat(high.toFixed(6)),
      low: parseFloat(low.toFixed(6)),
      open: lastPrice.open, // Keep original open price
      close: parseFloat(newPrice.toFixed(6)),
      volume: Math.floor(Math.random() * 10000) + 1000,
      per_ounce_price: parseFloat(perOuncePrice.toFixed(6)),
      price_gram_24k: parseFloat(priceGram24k.toFixed(6)),
      price_gram_22k: parseFloat(priceGram22k.toFixed(6)),
      price_gram_18k: parseFloat(priceGram18k.toFixed(6)),
      provider: 'mock',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error updating mock data for ${metal}:`, error);
    throw error;
  }
}

/**
 * Clean old mock data (keep only last 100 records per metal)
 */
async function cleanOldMockData() {
  try {
    for (const metal of Object.keys(METALS)) {
      // Get IDs of records to keep (last 100)
      const recordsToKeep = await db('metal_prices')
        .where({ metal, provider: 'mock' })
        .orderBy('created_at', 'desc')
        .limit(100)
        .pluck('id');
      
      if (recordsToKeep.length > 0) {
        // Delete older records
        const deletedCount = await db('metal_prices')
          .where({ metal, provider: 'mock' })
          .whereNotIn('id', recordsToKeep)
          .del();
        
        if (deletedCount > 0) {
          console.log(`🧹 Cleaned ${deletedCount} old mock records for ${metal}`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning old mock data:', error);
  }
}

/**
 * Initialize mock data if database is empty
 */
async function initializeMockData() {
  try {
    // Check if we have recent data for all metals
    const recentData = await db('metal_prices')
      .select('metal')
      .distinct('metal')
      .where('created_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000)); // Last 24 hours
    
    const existingMetals = recentData.map(row => row.metal);
    const missingMetals = Object.keys(METALS).filter(metal => !existingMetals.includes(metal));
    
    if (missingMetals.length > 0) {
      console.log(`📊 Initializing mock data for missing metals: ${missingMetals.join(', ')}`);
      
      for (const metal of missingMetals) {
        const mockData = generateMockPriceData(metal);
        await saveMockDataToDB(mockData);
        console.log(`✅ Initialized mock data for ${METALS[metal].name}`);
      }
    } else {
      console.log('✅ All metals have recent data in database');
    }
  } catch (error) {
    console.error('Error initializing mock data:', error);
  }
}

module.exports = {
  generateMockPriceData,
  saveMockDataToDB,
  generateAllMockData,
  updateMockData,
  cleanOldMockData,
  initializeMockData,
  METALS
};