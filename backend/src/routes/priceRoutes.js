const express = require('express');
const router = express.Router();
const marketPriceService = require('../services/marketPriceService');
const goldapiPriceService = require('../services/goldapiPriceService');
const dotenv = require('dotenv');
dotenv.config();

// GET /api/v1/prices/goldapi
router.get('/goldapi', async (req, res, next) => {
  try {
    const data = await goldapiPriceService.getGoldApiLivePrice();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/prices/metalprice
router.get('/metalprice', async (req, res, next) => {
  try {
    const data = await marketPriceService.getGoldSilverPrices();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/prices/carat
router.get('/carat', async (req, res, next) => {
  try {
    // Prefer GoldAPI for carat prices
    const goldData = await goldapiPriceService.getGoldApiLivePrice();
    if (goldData.error) return res.status(502).json(goldData);
    res.json({
      gram_24k: goldData.gram_24k,
      gram_22k: goldData.gram_22k,
      gram_18k: goldData.gram_18k,
      timestamp: goldData.timestamp,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/prices/history?days=7
router.get('/history', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const data = await marketPriceService.getHistoricalGoldSilverPrices(days);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/prices/current (switchable source)
router.get('/current', async (req, res, next) => {
  try {
    const source = process.env.PRIMARY_SOURCE || 'goldapi';
    if (source === 'metalprice') {
      const data = await marketPriceService.getGoldSilverPrices();
      res.json(data);
    } else {
      const data = await goldapiPriceService.getGoldApiLivePrice();
      res.json(data);
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
