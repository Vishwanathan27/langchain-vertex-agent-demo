// Service for fetching gold prices from GoldAPI.io (INR)
const { safeGet } = require('../config/axiosClient');
const { GOLD_API_KEY, GOLD_API_BASE } = require('../config/constants');

const headers = { 'x-access-token': GOLD_API_KEY, 'Content-Type': 'application/json' };

async function getGoldApiLivePrice() {
  const { data, error } = await safeGet(`${GOLD_API_BASE}/XAU/INR`, { headers });
  if (error || !data?.price) return { error: error || 'Data not yet available' };
  return {
    price_ounce: data.price,
    gram_24k: data.price_gram_24k || null,
    gram_22k: data.price_gram_22k || null,
    gram_18k: data.price_gram_18k || null,
    high: data.high_price || null,
    low: data.low_price || null,
    open: data.open_price || null,
    close: data.prev_close_price || null,
    timestamp: data.timestamp || null,
  };
}

module.exports = { getGoldApiLivePrice, /* ... */ };
