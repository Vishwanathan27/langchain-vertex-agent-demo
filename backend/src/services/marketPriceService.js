// Service for fetching gold/silver prices from MetalpriceAPI (INR)
const { safeGet } = require('../config/axiosClient');
const { METAL_API_KEY, METAL_API_BASE, CURRENCY_CONVERSION_API } = require('../config/constants');

async function getUsdToInrRate() {
  const { data, error } = await safeGet(`${CURRENCY_CONVERSION_API}?base=USD&symbols=INR`);
  if (error) return 83; // fallback
  return data.rates.INR;
}

async function getGoldSilverPrices() {
  const { data, error } = await safeGet(`${METAL_API_BASE}/latest`, {
    params: { api_key: METAL_API_KEY, base: 'USD', currencies: 'XAU,XAG' }
  });
  if (error) throw new Error(error);
  const usdToInr = await getUsdToInrRate();
  return {
    goldPriceInr: data.rates.XAU * usdToInr,
    silverPriceInr: data.rates.XAG * usdToInr,
    timestamp: data.timestamp,
  };
}

async function getGoldPriceByCarat() {
  const { data, error } = await safeGet(`${METAL_API_BASE}/carat`, {
    params: { api_key: METAL_API_KEY, base: 'USD', currency: 'INR' }
  });
  if (error) throw new Error(error);
  let caratPrices = {};
  let baseCurrency = data.base;
  if (baseCurrency === 'USD') {
    const usdToInr = await getUsdToInrRate();
    for (const [carat, price] of Object.entries(data.prices)) {
      caratPrices[carat] = price * usdToInr;
    }
    baseCurrency = 'INR';
  } else {
    caratPrices = data.prices;
  }
  return {
    caratPrices,
    baseCurrency,
    timestamp: data.timestamp,
  };
}

async function getHistoricalGoldSilverPrices(days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  const format = (d) => d.toISOString().slice(0, 10);
  const { data, error } = await safeGet(`${METAL_API_BASE}/timeframe`, {
    params: {
      api_key: METAL_API_KEY,
      base: 'USD',
      currencies: 'XAU,XAG',
      start_date: format(startDate),
      end_date: format(endDate),
    },
  });
  if (error) throw new Error(error);
  const usdToInr = await getUsdToInrRate();
  const results = [];
  for (const [date, rates] of Object.entries(data.rates)) {
    results.push({
      date,
      goldInr: rates.XAU * usdToInr,
      silverInr: rates.XAG * usdToInr,
    });
  }
  return results;
}

module.exports = {
  getGoldSilverPrices,
  getGoldPriceByCarat,
  getHistoricalGoldSilverPrices,
};
