// Centralized constants for SwarnaAI backend
module.exports = {
  METAL_API_KEY: process.env.METAL_API_KEY,
  METAL_API_BASE: process.env.METAL_API_BASE,
  CURRENCY_CONVERSION_API: process.env.CURRENCY_CONVERSION_API,
  GOLD_API_KEY: process.env.GOLD_API_KEY,
  GOLD_API_BASE: process.env.GOLD_API_BASE,
  PRIMARY_SOURCE: process.env.PRIMARY_SOURCE || 'goldapi',
  PORT: process.env.PORT || 3000,
};
