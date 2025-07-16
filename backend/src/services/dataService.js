const db = require('../db/connection');

class DataService {
  constructor() {
    this.CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300; // 5 minutes default
  }

  // Save metal price data to database
  async savePriceData(priceData, provider) {
    try {
      const dataToInsert = {
        metal: priceData.metal,
        currency: priceData.currency,
        price: priceData.price,
        price_gram_24k: priceData.price_gram_24k,
        price_gram_22k: priceData.price_gram_22k,
        price_gram_18k: priceData.price_gram_18k,
        high: priceData.high,
        low: priceData.low,
        open: priceData.open,
        close: priceData.close,
        change: priceData.change,
        change_percent: priceData.changePercent,
        ask: priceData.ask,
        bid: priceData.bid,
        symbol: priceData.symbol,
        exchange: priceData.exchange,
        provider: provider,
        price_timestamp: new Date(priceData.timestamp * 1000), // Convert to proper timestamp
        is_historical: false
      };

      // Use INSERT ON CONFLICT to avoid duplicates
      await db.raw(`
        INSERT INTO metal_prices (
          metal, currency, price, price_gram_24k, price_gram_22k, price_gram_18k,
          high, low, open, close, change, change_percent, ask, bid, symbol, 
          exchange, provider, price_timestamp, is_historical
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (metal, currency, price_timestamp, provider) 
        DO UPDATE SET
          price = EXCLUDED.price,
          price_gram_24k = EXCLUDED.price_gram_24k,
          price_gram_22k = EXCLUDED.price_gram_22k,
          price_gram_18k = EXCLUDED.price_gram_18k,
          high = EXCLUDED.high,
          low = EXCLUDED.low,
          open = EXCLUDED.open,
          close = EXCLUDED.close,
          change = EXCLUDED.change,
          change_percent = EXCLUDED.change_percent,
          ask = EXCLUDED.ask,
          bid = EXCLUDED.bid,
          updated_at = CURRENT_TIMESTAMP
      `, [
        dataToInsert.metal,
        dataToInsert.currency,
        dataToInsert.price,
        dataToInsert.price_gram_24k,
        dataToInsert.price_gram_22k,
        dataToInsert.price_gram_18k,
        dataToInsert.high,
        dataToInsert.low,
        dataToInsert.open,
        dataToInsert.close,
        dataToInsert.change,
        dataToInsert.change_percent,
        dataToInsert.ask,
        dataToInsert.bid,
        dataToInsert.symbol,
        dataToInsert.exchange,
        dataToInsert.provider,
        dataToInsert.price_timestamp,
        dataToInsert.is_historical
      ]);

      return true;
    } catch (error) {
      console.error('Error saving price data:', error);
      return false;
    }
  }

  // Save historical price data
  async saveHistoricalPriceData(priceData, provider, date) {
    try {
      const dataToInsert = {
        metal: priceData.metal,
        currency: priceData.currency,
        price: priceData.price,
        price_gram_24k: priceData.price_gram_24k,
        price_gram_22k: priceData.price_gram_22k,
        price_gram_18k: priceData.price_gram_18k,
        high: priceData.high,
        low: priceData.low,
        open: priceData.open,
        close: priceData.close,
        change: priceData.change,
        change_percent: priceData.changePercent,
        ask: priceData.ask,
        bid: priceData.bid,
        symbol: priceData.symbol,
        exchange: priceData.exchange,
        provider: provider,
        price_timestamp: new Date(date),
        is_historical: true
      };

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
      `, [
        dataToInsert.metal,
        dataToInsert.currency,
        dataToInsert.price,
        dataToInsert.price_gram_24k,
        dataToInsert.price_gram_22k,
        dataToInsert.price_gram_18k,
        dataToInsert.high,
        dataToInsert.low,
        dataToInsert.open,
        dataToInsert.close,
        dataToInsert.change,
        dataToInsert.change_percent,
        dataToInsert.ask,
        dataToInsert.bid,
        dataToInsert.symbol,
        dataToInsert.exchange,
        dataToInsert.provider,
        dataToInsert.price_timestamp,
        dataToInsert.is_historical
      ]);

      return true;
    } catch (error) {
      console.error('Error saving historical price data:', error);
      return false;
    }
  }

  // Get latest price from database (fallback)
  async getLatestPriceFromDB(metal, currency = 'INR') {
    try {
      const result = await db('metal_prices')
        .select('*')
        .where({
          metal: metal,
          currency: currency,
          is_historical: false
        })
        .orderBy('price_timestamp', 'desc')
        .first();

      if (!result) {
        return null;
      }

      return {
        metal: result.metal,
        currency: result.currency,
        price: parseFloat(result.price),
        price_gram_24k: result.price_gram_24k ? parseFloat(result.price_gram_24k) : null,
        price_gram_22k: result.price_gram_22k ? parseFloat(result.price_gram_22k) : null,
        price_gram_18k: result.price_gram_18k ? parseFloat(result.price_gram_18k) : null,
        high: result.high ? parseFloat(result.high) : null,
        low: result.low ? parseFloat(result.low) : null,
        open: result.open ? parseFloat(result.open) : null,
        close: result.close ? parseFloat(result.close) : null,
        change: result.change ? parseFloat(result.change) : null,
        changePercent: result.change_percent ? parseFloat(result.change_percent) : null,
        ask: result.ask ? parseFloat(result.ask) : null,
        bid: result.bid ? parseFloat(result.bid) : null,
        symbol: result.symbol,
        exchange: result.exchange,
        timestamp: Math.floor(result.price_timestamp.getTime() / 1000),
        provider: result.provider,
        cached: true
      };
    } catch (error) {
      console.error('Error getting latest price from DB:', error);
      return null;
    }
  }

  // Get historical price from database
  async getHistoricalPriceFromDB(metal, currency = 'INR', date) {
    try {
      const targetDate = new Date(date);
      
      const result = await db('metal_prices')
        .select('*')
        .where({
          metal: metal,
          currency: currency
        })
        .whereRaw('DATE(price_timestamp) = DATE(?)', [targetDate])
        .orderBy('price_timestamp', 'desc')
        .first();

      if (!result) {
        return null;
      }

      return {
        metal: result.metal,
        currency: result.currency,
        price: parseFloat(result.price),
        price_gram_24k: result.price_gram_24k ? parseFloat(result.price_gram_24k) : null,
        price_gram_22k: result.price_gram_22k ? parseFloat(result.price_gram_22k) : null,
        price_gram_18k: result.price_gram_18k ? parseFloat(result.price_gram_18k) : null,
        high: result.high ? parseFloat(result.high) : null,
        low: result.low ? parseFloat(result.low) : null,
        open: result.open ? parseFloat(result.open) : null,
        close: result.close ? parseFloat(result.close) : null,
        change: result.change ? parseFloat(result.change) : null,
        changePercent: result.change_percent ? parseFloat(result.change_percent) : null,
        ask: result.ask ? parseFloat(result.ask) : null,
        bid: result.bid ? parseFloat(result.bid) : null,
        symbol: result.symbol,
        exchange: result.exchange,
        timestamp: Math.floor(result.price_timestamp.getTime() / 1000),
        provider: result.provider,
        cached: true
      };
    } catch (error) {
      console.error('Error getting historical price from DB:', error);
      return null;
    }
  }

  // Get all latest prices from database
  async getAllLatestPricesFromDB(currency = 'INR') {
    try {
      // Use a subquery to get the latest record for each metal
      const results = await db('metal_prices as mp1')
        .select('mp1.*')
        .whereIn('mp1.metal', ['XAU', 'XAG', 'XPT', 'XPD'])
        .where('mp1.currency', currency)
        .where('mp1.is_historical', false)
        .whereNotExists(function() {
          this.select('*')
            .from('metal_prices as mp2')
            .where('mp2.metal', '=', db.raw('mp1.metal'))
            .where('mp2.currency', '=', db.raw('mp1.currency'))
            .where('mp2.is_historical', false)
            .where('mp2.created_at', '>', db.raw('mp1.created_at'));
        })
        .orderBy('mp1.created_at', 'desc');

      if (results.length === 0) {
        return null;
      }

      const priceData = {};
      const metalNames = {
        'XAU': 'gold',
        'XAG': 'silver',
        'XPT': 'platinum',
        'XPD': 'palladium'
      };

      results.forEach(result => {
        const metalName = metalNames[result.metal];
        if (metalName) {
          priceData[metalName] = {
            metal: result.metal,
            currency: result.currency,
            price: parseFloat(result.price),
            price_gram_24k: result.price_gram_24k ? parseFloat(result.price_gram_24k) : null,
            price_gram_22k: result.price_gram_22k ? parseFloat(result.price_gram_22k) : null,
            price_gram_18k: result.price_gram_18k ? parseFloat(result.price_gram_18k) : null,
            high: result.high ? parseFloat(result.high) : null,
            low: result.low ? parseFloat(result.low) : null,
            open: result.open ? parseFloat(result.open) : null,
            close: result.close ? parseFloat(result.close) : null,
            change: result.change ? parseFloat(result.change) : null,
            changePercent: result.change_percent ? parseFloat(result.change_percent) : null,
            ask: result.ask ? parseFloat(result.ask) : null,
            bid: result.bid ? parseFloat(result.bid) : null,
            symbol: result.symbol,
            exchange: result.exchange,
            timestamp: Math.floor(result.price_timestamp.getTime() / 1000),
            provider: result.provider,
            cached: true
          };
        }
      });

      return priceData;
    } catch (error) {
      console.error('Error getting all latest prices from DB:', error);
      return null;
    }
  }

  // Check if cached data is fresh
  async isCacheValid(metal, currency = 'INR', isHistorical = false) {
    try {
      const result = await db('metal_prices')
        .select('price_timestamp')
        .where({
          metal: metal,
          currency: currency,
          is_historical: isHistorical
        })
        .orderBy('price_timestamp', 'desc')
        .first();

      if (!result) {
        return false;
      }

      const cacheAge = (Date.now() - result.price_timestamp.getTime()) / 1000;
      return cacheAge < this.CACHE_TTL;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  }

  // Log API calls for monitoring
  async logAPICall(provider, endpoint, method, requestParams, responseData, statusCode, success, responseTime, errorMessage = null) {
    try {
      await db('api_logs').insert({
        provider: provider,
        endpoint: endpoint,
        method: method,
        request_params: JSON.stringify(requestParams),
        response_data: success ? JSON.stringify(responseData) : null,
        status_code: statusCode,
        error_message: errorMessage,
        response_time_ms: responseTime,
        success: success
      });
    } catch (error) {
      console.error('Error logging API call:', error);
    }
  }

  // Get API call statistics
  async getAPIStats(provider = null, hoursAgo = 24) {
    try {
      const query = db('api_logs')
        .select(
          'provider',
          db.raw('COUNT(*) as total_calls'),
          db.raw('COUNT(CASE WHEN success = true THEN 1 END) as successful_calls'),
          db.raw('COUNT(CASE WHEN success = false THEN 1 END) as failed_calls'),
          db.raw('AVG(response_time_ms) as avg_response_time'),
          db.raw('MAX(response_time_ms) as max_response_time'),
          db.raw('MIN(response_time_ms) as min_response_time')
        )
        .where('created_at', '>=', new Date(Date.now() - hoursAgo * 60 * 60 * 1000))
        .groupBy('provider');

      if (provider) {
        query.where('provider', provider);
      }

      const stats = await query;
      
      return stats.map(stat => ({
        provider: stat.provider,
        totalCalls: parseInt(stat.total_calls),
        successfulCalls: parseInt(stat.successful_calls),
        failedCalls: parseInt(stat.failed_calls),
        successRate: (stat.successful_calls / stat.total_calls * 100).toFixed(2),
        avgResponseTime: parseFloat(stat.avg_response_time).toFixed(2),
        maxResponseTime: parseInt(stat.max_response_time),
        minResponseTime: parseInt(stat.min_response_time)
      }));
    } catch (error) {
      console.error('Error getting API stats:', error);
      return [];
    }
  }

  // Clean old data
  async cleanOldData(daysToKeep = 30) {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      // Clean old non-historical price data (keep only latest for each metal/currency)
      await db.raw(`
        DELETE FROM metal_prices 
        WHERE is_historical = false 
        AND price_timestamp < ? 
        AND id NOT IN (
          SELECT DISTINCT ON (metal, currency) id
          FROM metal_prices
          WHERE is_historical = false
          ORDER BY metal, currency, price_timestamp DESC
        )
      `, [cutoffDate]);

      // Clean old API logs
      const deletedLogs = await db('api_logs')
        .where('created_at', '<', cutoffDate)
        .del();

      console.log(`✅ Cleaned ${deletedLogs} old API logs`);
      
      return true;
    } catch (error) {
      console.error('Error cleaning old data:', error);
      return false;
    }
  }
}

module.exports = new DataService();