// Enhanced API routes for real-time precious metals data
const express = require('express');
const metalpricerService = require('../services/apiAbstraction');
const { swarnaAIAgent } = require('../ai/aiAgent');
const { authenticate, authorize, adminOnly, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Metal mappings for backwards compatibility
const METALS = {
  'gold': 'XAU',
  'silver': 'XAG',
  'platinum': 'XPT',
  'palladium': 'XPD'
};

const CURRENCIES = {
  'INR': 'INR',
  'USD': 'USD',
  'EUR': 'EUR'
};

// Use imported METALS from service

/**
 * @swagger
 * /api/metals/live:
 *   get:
 *     summary: Get live prices for all supported metals
 *     description: Returns real-time price data for gold, silver, platinum, and palladium
 *     responses:
 *       200:
 *         description: Live price data for all metals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 gold:
 *                   $ref: '#/components/schemas/PriceData'
 *                 silver:
 *                   $ref: '#/components/schemas/PriceData'
 *                 platinum:
 *                   $ref: '#/components/schemas/PriceData'
 *                 palladium:
 *                   $ref: '#/components/schemas/PriceData'
 */
router.get('/live', optionalAuth, async (req, res) => {
  try {
    const response = await metalpricerService.getAllLivePrices('INR');
    
    if (response.success) {
      res.json({
        success: true,
        timestamp: response.timestamp,
        data: response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.error?.message || 'Failed to fetch live prices'
      });
    }
  } catch (error) {
    console.error('Error fetching live prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live prices'
    });
  }
});

/**
 * @swagger
 * /api/metals/{metal}/live:
 *   get:
 *     summary: Get live price for a specific metal
 *     parameters:
 *       - in: path
 *         name: metal
 *         schema:
 *           type: string
 *           enum: [gold, silver, platinum, palladium]
 *         required: true
 *         description: The metal to get price for
 *     responses:
 *       200:
 *         description: Live price data for the specified metal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PriceData'
 */
router.get('/:metal/live', async (req, res) => {
  try {
    const { metal } = req.params;
    
    if (!METALS[metal]) {
      return res.status(400).json({
        success: false,
        error: `Unsupported metal: ${metal}. Supported metals: ${Object.keys(METALS).join(', ')}`
      });
    }

    const metalSymbol = METALS[metal];
    const response = await metalpricerService.getLivePrice(metalSymbol, 'INR');
    
    if (response.success) {
      res.json({
        success: true,
        timestamp: response.timestamp,
        metal,
        data: response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.error?.message || `Failed to fetch ${metal} price`
      });
    }
  } catch (error) {
    console.error(`Error fetching ${req.params.metal} price:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to fetch ${req.params.metal} price`
    });
  }
});

/**
 * @swagger
 * /api/metals/{metal}/historical/{date}:
 *   get:
 *     summary: Get historical price for a specific metal on a specific date
 *     parameters:
 *       - in: path
 *         name: metal
 *         schema:
 *           type: string
 *           enum: [gold, silver, platinum, palladium]
 *         required: true
 *         description: The metal to get price for
 *       - in: path
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: Historical price data for the specified metal and date
 */
router.get('/:metal/historical/:date', async (req, res) => {
  try {
    const { metal, date } = req.params;
    
    if (!METALS[metal]) {
      return res.status(400).json({
        success: false,
        error: `Unsupported metal: ${metal}`
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    // Format date for GoldAPI (remove hyphens)
    const formattedDate = date.replace(/-/g, '');
    
    // Fetch historical data using our service
    const response = await metalpricerService.getHistoricalPrice(METALS[metal], 'INR', formattedDate);
    
    if (!response.success) {
      return res.status(404).json({
        success: false,
        error: response.error?.message || 'Historical data not found'
      });
    }
    
    const data = response.data;
    
    // Remove the old error check since we're handling it above

    res.json({
      success: true,
      date,
      metal,
      data
    });
  } catch (error) {
    console.error(`Error fetching historical data:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch historical data'
    });
  }
});

/**
 * @swagger
 * /api/metals/{metal}/chart/{period}:
 *   get:
 *     summary: Get chart data for a specific metal and time period
 *     parameters:
 *       - in: path
 *         name: metal
 *         schema:
 *           type: string
 *           enum: [gold, silver, platinum, palladium]
 *         required: true
 *         description: The metal to get chart data for
 *       - in: path
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1H, 4H, 1D, 1W, 1M, 3M, 1Y]
 *         required: true
 *         description: Time period for chart data
 *     responses:
 *       200:
 *         description: Chart data for the specified metal and period
 */
router.get('/:metal/chart/:period', async (req, res) => {
  try {
    const { metal, period } = req.params;
    
    if (!METALS[metal]) {
      return res.status(400).json({
        success: false,
        error: `Unsupported metal: ${metal}`
      });
    }

    // Generate chart data with current market price as baseline
    const generateChartData = async (period) => {
      const data = [];
      
      // Get current market price for baseline
      let basePrice;
      try {
        const response = await metalpricerService.getLivePrice(METALS[metal], 'INR');
        basePrice = response.success ? response.data.price : (metal === 'gold' ? 5400 : metal === 'silver' ? 82 : metal === 'platinum' ? 2890 : 1890);
      } catch (error) {
        basePrice = metal === 'gold' ? 5400 : metal === 'silver' ? 82 : metal === 'platinum' ? 2890 : 1890;
      }
      
      let points, timeUnit;
      switch (period) {
        case '1H': points = 60; timeUnit = 'minute'; break;
        case '4H': points = 240; timeUnit = 'minute'; break;
        case '1D': points = 24; timeUnit = 'hour'; break;
        case '1W': points = 7; timeUnit = 'day'; break;
        case '1M': points = 30; timeUnit = 'day'; break;
        case '3M': points = 90; timeUnit = 'day'; break;
        case '1Y': points = 365; timeUnit = 'day'; break;
        default: points = 24; timeUnit = 'hour';
      }
      
      for (let i = 0; i < points; i++) {
        const variation = (Math.random() - 0.5) * (basePrice * 0.02);
        const price = basePrice + variation + (Math.sin(i / 10) * basePrice * 0.01);
        
        const timestamp = new Date();
        if (timeUnit === 'minute') {
          timestamp.setMinutes(timestamp.getMinutes() - (points - i));
        } else if (timeUnit === 'hour') {
          timestamp.setHours(timestamp.getHours() - (points - i));
        } else if (timeUnit === 'day') {
          timestamp.setDate(timestamp.getDate() - (points - i));
        }
        
        data.push({
          timestamp: timestamp.toISOString(),
          price: Math.round(price * 100) / 100,
          volume: Math.round(Math.random() * 1000000)
        });
      }
      
      return data;
    };

    const chartData = await generateChartData(period);
    
    res.json({
      success: true,
      metal,
      period,
      data: chartData
    });
  } catch (error) {
    console.error(`Error fetching chart data:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chart data'
    });
  }
});

/**
 * @swagger
 * /api/ai/insights:
 *   post:
 *     summary: Get AI-generated market insights
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metal:
 *                 type: string
 *                 enum: [gold, silver, platinum, palladium]
 *               query:
 *                 type: string
 *                 description: User's question or query
 *               context:
 *                 type: object
 *                 description: Additional context like current prices, historical data
 *     responses:
 *       200:
 *         description: AI-generated insights and recommendations
 */
router.post('/ai/insights', async (req, res) => {
  try {
    const { metal, query, context } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    // Enhance query with context
    const enhancedQuery = `${query}. Context: Currently analyzing ${metal || 'precious metals'} market data. ${context ? `Additional context: ${JSON.stringify(context)}` : ''}`;
    
    // Get AI response
    const aiResponse = await swarnaAIAgent(enhancedQuery, []);
    
    res.json({
      success: true,
      query,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI insights'
    });
  }
});

/**
 * @swagger
 * /api/alerts:
 *   post:
 *     summary: Create a price alert
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metal:
 *                 type: string
 *                 enum: [gold, silver, platinum, palladium]
 *               type:
 *                 type: string
 *                 enum: [above, below]
 *               targetPrice:
 *                 type: number
 *               email:
 *                 type: string
 *                 format: email
 *             required:
 *               - metal
 *               - type
 *               - targetPrice
 *     responses:
 *       200:
 *         description: Alert created successfully
 */
router.post('/alerts', async (req, res) => {
  try {
    const { metal, type, targetPrice, email } = req.body;
    
    if (!METALS[metal]) {
      return res.status(400).json({
        success: false,
        error: `Unsupported metal: ${metal}`
      });
    }

    if (!['above', 'below'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Alert type must be "above" or "below"'
      });
    }

    if (!targetPrice || typeof targetPrice !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Valid target price is required'
      });
    }

    // In a real implementation, this would be stored in a database
    const alert = {
      id: Date.now().toString(),
      metal,
      type,
      targetPrice,
      email,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Alert created successfully',
      alert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create alert'
    });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     PriceData:
 *       type: object
 *       properties:
 *         price:
 *           type: number
 *           description: Current price per ounce in INR
 *         price_gram_24k:
 *           type: number
 *           description: Price per gram for 24K gold (gold only)
 *         price_gram_22k:
 *           type: number
 *           description: Price per gram for 22K gold (gold only)
 *         price_gram_18k:
 *           type: number
 *           description: Price per gram for 18K gold (gold only)
 *         high:
 *           type: number
 *           description: 24-hour high price
 *         low:
 *           type: number
 *           description: 24-hour low price
 *         open:
 *           type: number
 *           description: Opening price
 *         close:
 *           type: number
 *           description: Previous close price
 *         change:
 *           type: number
 *           description: Price change from previous close
 *         changePercent:
 *           type: number
 *           description: Percentage change from previous close
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the price data
 */

/**
 * @swagger
 * /api/admin/provider/switch:
 *   post:
 *     summary: Switch primary API provider
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [goldapi, metalpriceapi, db]
 *             required:
 *               - provider
 *     responses:
 *       200:
 *         description: Provider switched successfully
 */
router.post('/admin/provider/switch', async (req, res) => {
  try {
    const { provider } = req.body;
    
    if (!['goldapi', 'metalpriceapi', 'db'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid provider. Must be goldapi, metalpriceapi, or db'
      });
    }
    
    metalpricerService.switchProvider(provider);
    
    let message = `Switched to ${provider} provider`;
    if (provider === 'db') {
      message = 'Switched to DB-only mode - no external API calls will be made';
    }
    
    res.json({
      success: true,
      message,
      provider,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error switching provider:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to switch provider'
    });
  }
});

/**
 * @swagger
 * /api/admin/provider/health:
 *   get:
 *     summary: Check health of all API providers
 *     responses:
 *       200:
 *         description: Health status of all providers
 */
router.get('/admin/provider/health', async (req, res) => {
  try {
    const providers = ['goldapi', 'metalpriceapi'];
    const healthChecks = await Promise.all(
      providers.map(provider => metalpricerService.healthCheck(provider))
    );
    
    res.json({
      success: true,
      data: {
        primary: metalpricerService.primaryProvider,
        fallback: metalpricerService.fallbackProvider,
        health: healthChecks
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking provider health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check provider health'
    });
  }
});

/**
 * @swagger
 * /api/admin/provider/status:
 *   get:
 *     summary: Get current API provider configuration
 *     responses:
 *       200:
 *         description: Current provider configuration
 */
router.get('/admin/provider/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        primary: metalpricerService.primaryProvider,
        fallback: metalpricerService.fallbackProvider,
        retryCount: metalpricerService.retryCount,
        retryDelay: metalpricerService.retryDelay
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting provider status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get provider status'
    });
  }
});

/**
 * @swagger
 * /api/metals/convert:
 *   get:
 *     summary: Convert currency amounts using MetalPriceAPI
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         required: true
 *         description: Source currency/metal
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         required: true
 *         description: Target currency/metal
 *       - in: query
 *         name: amount
 *         schema:
 *           type: number
 *         required: true
 *         description: Amount to convert
 *     responses:
 *       200:
 *         description: Conversion result
 */
router.get('/convert', async (req, res) => {
  try {
    const { from, to, amount } = req.query;
    
    if (!from || !to || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: from, to, amount'
      });
    }

    const response = await metalpricerService.convertPrice(from, to, parseFloat(amount));
    
    if (response.success) {
      res.json({
        success: true,
        timestamp: response.timestamp,
        data: response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.error?.message || 'Failed to convert price'
      });
    }
  } catch (error) {
    console.error('Error converting price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert price'
    });
  }
});

/**
 * @swagger
 * /api/metals/timeframe:
 *   get:
 *     summary: Get exchange rates for a specific time period
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: base
 *         schema:
 *           type: string
 *           default: INR
 *         description: Base currency
 *       - in: query
 *         name: currencies
 *         schema:
 *           type: string
 *           default: XAU,XAG,XPT,XPD
 *         description: Comma-separated list of currencies
 *     responses:
 *       200:
 *         description: Timeframe data
 */
router.get('/timeframe', async (req, res) => {
  try {
    const { start_date, end_date, base = 'INR', currencies = 'XAU,XAG,XPT,XPD' } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: start_date, end_date'
      });
    }

    const response = await metalpricerService.getTimeframeData(start_date, end_date, base, currencies);
    
    if (response.success) {
      res.json({
        success: true,
        timestamp: response.timestamp,
        data: response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.error?.message || 'Failed to get timeframe data'
      });
    }
  } catch (error) {
    console.error('Error getting timeframe data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get timeframe data'
    });
  }
});

/**
 * @swagger
 * /api/metals/change:
 *   get:
 *     summary: Get currency change parameters (margin, percentage)
 *     parameters:
 *       - in: query
 *         name: base
 *         schema:
 *           type: string
 *           default: INR
 *         description: Base currency
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: currencies
 *         schema:
 *           type: string
 *           default: XAU,XAG,XPT,XPD
 *         description: Comma-separated list of currencies
 *     responses:
 *       200:
 *         description: Change data
 */
router.get('/change', async (req, res) => {
  try {
    const { base = 'INR', start_date, end_date, currencies = 'XAU,XAG,XPT,XPD' } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: start_date, end_date'
      });
    }

    const response = await metalpricerService.getChangeData(base, start_date, end_date, currencies);
    
    if (response.success) {
      res.json({
        success: true,
        timestamp: response.timestamp,
        data: response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.error?.message || 'Failed to get change data'
      });
    }
  } catch (error) {
    console.error('Error getting change data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get change data'
    });
  }
});

/**
 * @swagger
 * /api/metals/carat:
 *   get:
 *     summary: Get gold prices by carat
 *     responses:
 *       200:
 *         description: Carat data
 */
router.get('/carat', async (req, res) => {
  try {
    const response = await metalpricerService.getCaratData();
    
    if (response.success) {
      res.json({
        success: true,
        timestamp: response.timestamp,
        data: response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.error?.message || 'Failed to get carat data'
      });
    }
  } catch (error) {
    console.error('Error getting carat data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get carat data'
    });
  }
});

/**
 * @swagger
 * /api/metals/symbols:
 *   get:
 *     summary: Get list of all supported currencies and metals
 *     responses:
 *       200:
 *         description: Symbols data
 */
router.get('/symbols', async (req, res) => {
  try {
    const response = await metalpricerService.getSymbols();
    
    if (response.success) {
      res.json({
        success: true,
        timestamp: response.timestamp,
        data: response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.error?.message || 'Failed to get symbols'
      });
    }
  } catch (error) {
    console.error('Error getting symbols:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get symbols'
    });
  }
});

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get API usage statistics (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *         description: Filter by provider
 *       - in: query
 *         name: hours
 *         schema:
 *           type: number
 *           default: 24
 *         description: Hours to look back
 *     responses:
 *       200:
 *         description: API statistics
 */
router.get('/admin/stats', adminOnly, async (req, res) => {
  try {
    const { provider, hours = 24 } = req.query;
    const response = await metalpricerService.getAPIStats(provider, parseInt(hours));
    
    if (response.success) {
      res.json({
        success: true,
        timestamp: response.timestamp,
        stats: response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.error?.message || 'Failed to get API stats'
      });
    }
  } catch (error) {
    console.error('Error getting API stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get API stats'
    });
  }
});

/**
 * @swagger
 * /api/admin/cleanup:
 *   post:
 *     summary: Clean up old data (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysToKeep:
 *                 type: number
 *                 default: 30
 *     responses:
 *       200:
 *         description: Cleanup completed
 */
router.post('/admin/cleanup', adminOnly, async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;
    const response = await metalpricerService.cleanOldData(parseInt(daysToKeep));
    
    if (response.success) {
      res.json({
        success: true,
        message: `Cleaned up data older than ${daysToKeep} days`,
        timestamp: response.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: response.error?.message || 'Failed to clean up data'
      });
    }
  } catch (error) {
    console.error('Error cleaning up data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean up data'
    });
  }
});

module.exports = router;