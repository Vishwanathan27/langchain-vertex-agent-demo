/**
 * Bulk Data Sync Service for Metal Price API
 * 
 * This service handles bulk fetching of historical data from MetalPriceAPI endpoints
 * and stores it in the database for UI consumption.
 * 
 * Features:
 * - Fetch and store 1-year timeframe data
 * - Fetch symbols data
 * - Fetch carat data
 * - Store change data and conversion rates
 * - Batch processing with rate limiting
 * 
 * @author SwarnaAI Backend Team
 */

const metalpricerService = require('./apiAbstraction');
const dataService = require('./dataService');
const { createLogger } = require('../utils/logger');

const logger = createLogger('BulkDataSync');

class BulkDataSyncService {
  constructor() {
    this.metals = ['XAU', 'XAG', 'XPT', 'XPD'];
    this.currency = 'INR';
    this.batchDelay = parseInt(process.env.BATCH_DELAY) || 1000; // 1 second between batches
    this.isRunning = false;
  }

  /**
   * Perform complete bulk data sync
   */
  async performBulkSync() {
    if (this.isRunning) {
      logger.warn('Bulk sync already in progress');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      logger.info('Starting bulk data synchronization...');

      // 1. Fetch symbols data
      await this.fetchAndStoreSymbols();
      await this.delay();

      // 2. Fetch latest prices for all metals
      await this.fetchAndStoreLatestPrices();
      await this.delay();

      // 3. Fetch 1-year timeframe data
      await this.fetchAndStoreTimeframeData();
      await this.delay();

      // 4. Fetch carat data
      await this.fetchAndStoreCaratData();
      await this.delay();

      // 5. Fetch change data for the last year
      await this.fetchAndStoreChangeData();

      const duration = Date.now() - startTime;
      logger.info(`Bulk data sync completed in ${duration}ms`);

    } catch (error) {
      logger.error('Bulk data sync failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Fetch and store symbols data
   */
  async fetchAndStoreSymbols() {
    try {
      logger.info('Fetching symbols data...');
      
      const response = await metalpricerService.getSymbols();
      if (response.success) {
        // Store symbols data in a new table or as JSON
        await this.storeSymbolsData(response.data);
        logger.info('Symbols data stored successfully');
      } else {
        logger.error('Failed to fetch symbols:', response.error);
      }
    } catch (error) {
      logger.error('Error fetching symbols:', error);
    }
  }

  /**
   * Fetch and store latest prices
   */
  async fetchAndStoreLatestPrices() {
    try {
      logger.info('Fetching latest prices for all metals...');
      
      const response = await metalpricerService.getAllLivePrices(this.currency);
      if (response.success) {
        logger.info('Latest prices stored successfully');
      } else {
        logger.error('Failed to fetch latest prices:', response.error);
      }
    } catch (error) {
      logger.error('Error fetching latest prices:', error);
    }
  }

  /**
   * Fetch and store 1-year timeframe data
   */
  async fetchAndStoreTimeframeData() {
    try {
      logger.info('Fetching 1-year timeframe data...');
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);

      const startDateStr = this.formatDate(startDate);
      const endDateStr = this.formatDate(endDate);

      logger.info(`Fetching timeframe data from ${startDateStr} to ${endDateStr}`);

      const response = await metalpricerService.getTimeframeData(
        startDateStr, 
        endDateStr, 
        this.currency, 
        this.metals.join(',')
      );

      if (response.success) {
        await this.storeTimeframeData(response.data);
        logger.info('1-year timeframe data stored successfully');
      } else {
        logger.error('Failed to fetch timeframe data:', response.error);
      }
    } catch (error) {
      logger.error('Error fetching timeframe data:', error);
    }
  }

  /**
   * Fetch and store carat data
   */
  async fetchAndStoreCaratData() {
    try {
      logger.info('Fetching carat data...');
      
      const response = await metalpricerService.getCaratData();
      if (response.success) {
        await this.storeCaratData(response.data);
        logger.info('Carat data stored successfully');
      } else {
        logger.error('Failed to fetch carat data:', response.error);
      }
    } catch (error) {
      logger.error('Error fetching carat data:', error);
    }
  }

  /**
   * Fetch and store change data
   */
  async fetchAndStoreChangeData() {
    try {
      logger.info('Fetching change data for last year...');
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);

      const startDateStr = this.formatDate(startDate);
      const endDateStr = this.formatDate(endDate);

      const response = await metalpricerService.getChangeData(
        this.currency,
        startDateStr,
        endDateStr,
        this.metals.join(',')
      );

      if (response.success) {
        await this.storeChangeData(response.data);
        logger.info('Change data stored successfully');
      } else {
        logger.error('Failed to fetch change data:', response.error);
      }
    } catch (error) {
      logger.error('Error fetching change data:', error);
    }
  }

  /**
   * Store symbols data
   */
  async storeSymbolsData(symbolsData) {
    try {
      // Store as JSON in a dedicated field or create a symbols table
      const db = require('../db/connection');
      
      await db.raw(`
        INSERT INTO api_logs (
          provider, endpoint, method, request_params, response_data, 
          status_code, success, response_time_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT DO NOTHING
      `, [
        'metalpriceapi',
        'symbols',
        'STORE',
        JSON.stringify({}),
        JSON.stringify(symbolsData),
        200,
        true,
        0,
        new Date()
      ]);

      logger.info('Symbols data stored in api_logs for reference');
    } catch (error) {
      logger.error('Error storing symbols data:', error);
    }
  }

  /**
   * Store timeframe data
   */
  async storeTimeframeData(timeframeData) {
    try {
      if (!timeframeData.rates) {
        logger.warn('No rates data in timeframe response');
        return;
      }

      let storedCount = 0;
      
      // Process each date in the timeframe
      for (const date in timeframeData.rates) {
        const dayRates = timeframeData.rates[date];
        
        // Process each metal for this date
        for (const metal of this.metals) {
          if (dayRates[metal]) {
            const priceData = {
              metal: metal,
              currency: this.currency,
              price: dayRates[metal],
              price_gram_24k: null,
              price_gram_22k: null,
              price_gram_18k: null,
              high: null,
              low: null,
              open: null,
              close: null,
              change: null,
              changePercent: null,
              ask: null,
              bid: null,
              symbol: metal,
              exchange: 'metalpriceapi',
              timestamp: Math.floor(new Date(date).getTime() / 1000)
            };

            await dataService.saveHistoricalPriceData(priceData, 'metalpriceapi', date);
            storedCount++;
          }
        }
      }

      logger.info(`Stored ${storedCount} historical price records from timeframe data`);
    } catch (error) {
      logger.error('Error storing timeframe data:', error);
    }
  }

  /**
   * Store carat data
   */
  async storeCaratData(caratData) {
    try {
      // Store carat data in api_logs for reference
      const db = require('../db/connection');
      
      await db.raw(`
        INSERT INTO api_logs (
          provider, endpoint, method, request_params, response_data, 
          status_code, success, response_time_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT DO NOTHING
      `, [
        'metalpriceapi',
        'carat',
        'STORE',
        JSON.stringify({}),
        JSON.stringify(caratData),
        200,
        true,
        0,
        new Date()
      ]);

      logger.info('Carat data stored in api_logs for reference');
    } catch (error) {
      logger.error('Error storing carat data:', error);
    }
  }

  /**
   * Store change data
   */
  async storeChangeData(changeData) {
    try {
      // Store change data in api_logs for reference and analysis
      const db = require('../db/connection');
      
      await db.raw(`
        INSERT INTO api_logs (
          provider, endpoint, method, request_params, response_data, 
          status_code, success, response_time_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT DO NOTHING
      `, [
        'metalpriceapi',
        'change',
        'STORE',
        JSON.stringify({ period: '1year' }),
        JSON.stringify(changeData),
        200,
        true,
        0,
        new Date()
      ]);

      logger.info('Change data stored in api_logs for reference');
    } catch (error) {
      logger.error('Error storing change data:', error);
    }
  }

  /**
   * Get stored symbols data
   */
  async getStoredSymbols() {
    try {
      const db = require('../db/connection');
      
      const result = await db('api_logs')
        .select('response_data')
        .where({
          provider: 'metalpriceapi',
          endpoint: 'symbols',
          success: true
        })
        .orderBy('created_at', 'desc')
        .first();

      return result ? JSON.parse(result.response_data) : null;
    } catch (error) {
      logger.error('Error getting stored symbols:', error);
      return null;
    }
  }

  /**
   * Get stored carat data
   */
  async getStoredCaratData() {
    try {
      const db = require('../db/connection');
      
      const result = await db('api_logs')
        .select('response_data')
        .where({
          provider: 'metalpriceapi',
          endpoint: 'carat',
          success: true
        })
        .orderBy('created_at', 'desc')
        .first();

      return result ? JSON.parse(result.response_data) : null;
    } catch (error) {
      logger.error('Error getting stored carat data:', error);
      return null;
    }
  }

  /**
   * Get stored change data
   */
  async getStoredChangeData() {
    try {
      const db = require('../db/connection');
      
      const result = await db('api_logs')
        .select('response_data')
        .where({
          provider: 'metalpriceapi',
          endpoint: 'change',
          success: true
        })
        .orderBy('created_at', 'desc')
        .first();

      return result ? JSON.parse(result.response_data) : null;
    } catch (error) {
      logger.error('Error getting stored change data:', error);
      return null;
    }
  }

  /**
   * Get historical data for charts (1 year)
   */
  async getHistoricalDataForCharts(metal, currency = 'INR', days = 365) {
    try {
      const db = require('../db/connection');
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const results = await db('metal_prices')
        .select('price', 'price_timestamp')
        .where({
          metal: metal,
          currency: currency
        })
        .where('price_timestamp', '>=', startDate)
        .where('price_timestamp', '<=', endDate)
        .orderBy('price_timestamp', 'asc');

      return results.map(row => ({
        timestamp: Math.floor(row.price_timestamp.getTime() / 1000),
        price: parseFloat(row.price),
        date: row.price_timestamp.toISOString().split('T')[0]
      }));
    } catch (error) {
      logger.error('Error getting historical data for charts:', error);
      return [];
    }
  }

  /**
   * Test conversion functionality
   */
  async testConversion(from = 'USD', to = 'XAU', amount = 100) {
    try {
      logger.info(`Testing conversion: ${amount} ${from} to ${to}`);
      
      const response = await metalpricerService.convertPrice(from, to, amount);
      if (response.success) {
        logger.info('Conversion test successful:', response.data);
        return response.data;
      } else {
        logger.error('Conversion test failed:', response.error);
        return null;
      }
    } catch (error) {
      logger.error('Error testing conversion:', error);
      return null;
    }
  }

  /**
   * Utility: Format date as YYYY-MM-DD
   */
  formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Utility: Add delay between API calls
   */
  async delay() {
    return new Promise(resolve => setTimeout(resolve, this.batchDelay));
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      supportedMetals: this.metals,
      currency: this.currency,
      batchDelay: this.batchDelay
    };
  }
}

// Export singleton instance
module.exports = new BulkDataSyncService();