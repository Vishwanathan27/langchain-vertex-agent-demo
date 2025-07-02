// Centralized Axios client with error handling for SwarnaAI backend
const axios = require('axios');

async function safeGet(url, options = {}) {
  try {
    const { data } = await axios.get(url, options);
    return { data, error: null };
  } catch (err) {
    const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
    return { data: null, error: errorMsg };
  }
}

module.exports = { safeGet };