// Enhanced API routes for real-time precious metals data
const express = require('express');
const { 
  getAllMetalPrices, 
  getMetalPrice, 
  getHistoricalPrice, 
  getPriceRange,
  getAPIStats,
  METALS,
  CURRENCIES
} = require('../services/goldapiPriceService');
const { swarnaAIAgent } = require('../ai/aiAgent');
const router = express.Router();

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
router.get('/live', async (req, res) => {
  try {
    const prices = {};
    
    // Fetch prices for all metals concurrently
    const pricePromises = Object.keys(METALS).map(async (metal) => {
      try {
        const metalSymbol = METALS[metal];
        const priceData = await getMetalPrice(metalSymbol, 'INR');
        return { metal, data: priceData };
      } catch (error) {
        console.error(`Error fetching ${metal} price:`, error);
        return { metal, data: { error: `Failed to fetch ${metal} price` } };
      }
    });

    const results = await Promise.all(pricePromises);
    
    results.forEach(({ metal, data }) => {
      prices[metal] = data;
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: prices
    });
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
    const priceData = await getMetalPrice(metalSymbol, 'INR');
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metal,
      data: priceData
    });
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
    const data = await getHistoricalPrice(METALS[metal], 'INR', formattedDate);
    
    if (data.error) {
      return res.status(404).json({
        success: false,
        error: data.error
      });
    }

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
        const currentPrice = await getMetalPrice(METALS[metal], 'INR');
        basePrice = currentPrice.price || (metal === 'gold' ? 5400 : metal === 'silver' ? 82 : metal === 'platinum' ? 2890 : 1890);
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

module.exports = router;