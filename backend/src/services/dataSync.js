/**
 * Data Sync Service
 * 
 * This service handles scheduled data synchronization from external APIs to the database.
 * It ensures the application always has fresh data while maintaining DB-only mode during runtime.
 * 
 * Features:
 * - Configurable sync intervals
 * - Automatic retry logic with exponential backoff
 * - Comprehensive error handling and logging
 * - Graceful shutdown handling
 * - API rate limiting compliance
 * 
 * @author SwarnaAI Backend Team
 */

const cron = require('node-cron');
const metalpricerService = require('./apiAbstraction');
const dataService = require('./dataService');
const { createLogger } = require('../utils/logger');

const logger = createLogger('DataSync');

class DataSyncService {
  constructor() {
    this.syncInterval = process.env.DATA_SYNC_INTERVAL || '0 0 * * *'; // Default: daily at midnight
    this.isRunning = false;
    this.currentTask = null;
    this.retryAttempts = parseInt(process.env.DATA_SYNC_RETRY_ATTEMPTS) || 3;
    this.retryDelay = parseInt(process.env.DATA_SYNC_RETRY_DELAY) || 5000; // 5 seconds
    this.maxRetryDelay = parseInt(process.env.DATA_SYNC_MAX_RETRY_DELAY) || 300000; // 5 minutes
    
    // Metals to sync
    this.metals = ['XAU', 'XAG', 'XPT', 'XPD'];
    this.currency = 'INR';
    
    // Sync statistics
    this.stats = {
      lastSync: null,
      successCount: 0,
      errorCount: 0,
      totalSynced: 0
    };
  }

  /**
   * Start the data sync scheduler
   */
  start() {
    if (this.isRunning) {
      logger.warn('Data sync scheduler is already running');
      return;
    }

    // Validate cron expression
    if (!cron.validate(this.syncInterval)) {
      logger.error(`Invalid cron expression: ${this.syncInterval}`);
      return;
    }

    this.currentTask = cron.schedule(this.syncInterval, async () => {
      await this.performSync();
    }, {
      scheduled: true,
      timezone: process.env.TIMEZONE || 'UTC'
    });

    this.isRunning = true;
    logger.info(`Data sync scheduler started with interval: ${this.syncInterval}`);
    
    // Perform initial sync if no recent data exists
    this.performInitialSyncIfNeeded();
  }

  /**
   * Stop the data sync scheduler
   */
  stop() {
    if (this.currentTask) {
      this.currentTask.stop();
      this.currentTask = null;
    }
    this.isRunning = false;
    logger.info('Data sync scheduler stopped');
  }

  /**
   * Perform initial sync if database has no recent data
   */
  async performInitialSyncIfNeeded() {
    try {
      // Check if we have recent data (within last 24 hours)
      const hasRecentData = await this.hasRecentData();
      
      if (!hasRecentData) {
        logger.info('No recent data found, performing initial sync');
        await this.performSync();
      } else {
        logger.info('Recent data found, skipping initial sync');
      }
    } catch (error) {
      logger.error('Error checking for recent data:', error);
    }
  }

  /**
   * Check if database has recent data
   */
  async hasRecentData() {
    try {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      for (const metal of this.metals) {
        const latestData = await dataService.getLatestPriceFromDB(metal, this.currency);
        
        if (!latestData || new Date(latestData.timestamp * 1000) < cutoffTime) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Error checking recent data:', error);
      return false;
    }
  }

  /**
   * Perform the actual data synchronization
   */
  async performSync() {
    logger.info('Starting data synchronization...');
    
    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    try {
      // Temporarily switch to API mode for sync
      const originalProvider = metalpricerService.primaryProvider;
      const syncProvider = process.env.SYNC_API_PROVIDER || 'metalpriceapi';
      
      logger.info(`Switching to ${syncProvider} for data sync`);
      metalpricerService.switchProvider(syncProvider);

      // Sync all metals
      for (const metal of this.metals) {
        try {
          await this.syncMetalData(metal);
          successCount++;
          logger.info(`Successfully synced ${metal} data`);
        } catch (error) {
          errorCount++;
          logger.error(`Failed to sync ${metal} data:`, error.message);
        }
      }

      // Restore original provider
      logger.info(`Restoring original provider: ${originalProvider}`);
      metalpricerService.switchProvider(originalProvider);

      // Update statistics
      this.stats.lastSync = new Date();
      this.stats.successCount += successCount;
      this.stats.errorCount += errorCount;
      this.stats.totalSynced += successCount;

      const duration = Date.now() - startTime;
      logger.info(`Data sync completed in ${duration}ms. Success: ${successCount}, Errors: ${errorCount}`);

      // Log sync statistics
      await this.logSyncStats(successCount, errorCount, duration);

    } catch (error) {
      logger.error('Data sync failed:', error);
      this.stats.errorCount++;
    }
  }

  /**
   * Sync data for a specific metal with retry logic
   */
  async syncMetalData(metal, attempt = 1) {
    try {
      const response = await metalpricerService.getLivePrice(metal, this.currency);
      
      if (response.success) {
        // Save to database
        await dataService.savePriceData(response.data, 'sync');
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to fetch price data');
      }
    } catch (error) {
      if (attempt < this.retryAttempts) {
        const delay = Math.min(this.retryDelay * Math.pow(2, attempt - 1), this.maxRetryDelay);
        logger.warn(`Sync failed for ${metal} (attempt ${attempt}/${this.retryAttempts}), retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.syncMetalData(metal, attempt + 1);
      } else {
        throw error;
      }
    }
  }

  /**
   * Log sync statistics to database
   */
  async logSyncStats(successCount, errorCount, duration) {
    try {
      await dataService.logAPICall(
        'sync',
        'performSync',
        'SYNC',
        { metals: this.metals, currency: this.currency },
        { successCount, errorCount, duration },
        successCount > 0 ? 200 : 500,
        successCount > 0,
        duration,
        errorCount > 0 ? `${errorCount} metals failed to sync` : null
      );
    } catch (error) {
      logger.error('Failed to log sync statistics:', error);
    }
  }

  /**
   * Manually trigger a sync (for admin use)
   */
  async triggerManualSync() {
    logger.info('Manual sync triggered');
    await this.performSync();
  }

  /**
   * Get sync statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
      syncInterval: this.syncInterval,
      nextSync: this.currentTask ? this.currentTask.nextDate() : null
    };
  }

  /**
   * Update sync interval
   */
  updateSyncInterval(newInterval) {
    if (!cron.validate(newInterval)) {
      throw new Error(`Invalid cron expression: ${newInterval}`);
    }

    this.syncInterval = newInterval;
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }
    
    logger.info(`Sync interval updated to: ${newInterval}`);
  }

  /**
   * Get next sync time
   */
  getNextSyncTime() {
    if (!this.currentTask) {
      return null;
    }

    return this.currentTask.nextDate();
  }

  /**
   * Health check for the sync service
   */
  async healthCheck() {
    const stats = this.getStats();
    const health = {
      status: 'healthy',
      isRunning: this.isRunning,
      lastSync: stats.lastSync,
      nextSync: stats.nextSync,
      successRate: stats.successCount / Math.max(stats.successCount + stats.errorCount, 1)
    };

    // Check if last sync was too long ago
    if (stats.lastSync) {
      const timeSinceLastSync = Date.now() - stats.lastSync.getTime();
      const expectedInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (timeSinceLastSync > expectedInterval * 2) {
        health.status = 'warning';
        health.message = 'Last sync was too long ago';
      }
    }

    // Check error rate
    if (stats.errorCount > 0 && health.successRate < 0.5) {
      health.status = 'error';
      health.message = 'High error rate in recent syncs';
    }

    return health;
  }
}

// Export singleton instance
const dataSyncService = new DataSyncService();

module.exports = dataSyncService;