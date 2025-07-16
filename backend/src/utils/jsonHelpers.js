// JSON handling utilities to prevent PostgreSQL JSON parsing issues

/**
 * Safely parse JSON that might already be parsed by PostgreSQL
 * @param {*} data - The data to parse (could be string or already parsed)
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed data or default value
 */
function safeJsonParse(data, defaultValue = null) {
  // If data is already an object or array, return it as-is
  if (typeof data === 'object' && data !== null) {
    return data;
  }
  
  // If data is a string, try to parse it
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.warn('Failed to parse JSON string:', data, error.message);
      return defaultValue;
    }
  }
  
  // For other types, return the default value
  return defaultValue;
}

/**
 * Safely get array data from potentially parsed JSON
 * @param {*} data - The data to get as array
 * @param {Array} defaultValue - Default array if parsing fails
 * @returns {Array} Array data
 */
function safeJsonArray(data, defaultValue = []) {
  const parsed = safeJsonParse(data, defaultValue);
  return Array.isArray(parsed) ? parsed : defaultValue;
}

/**
 * Safely get object data from potentially parsed JSON
 * @param {*} data - The data to get as object
 * @param {Object} defaultValue - Default object if parsing fails
 * @returns {Object} Object data
 */
function safeJsonObject(data, defaultValue = {}) {
  const parsed = safeJsonParse(data, defaultValue);
  return (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) ? parsed : defaultValue;
}

/**
 * Safely stringify data for database storage
 * @param {*} data - The data to stringify
 * @returns {string} JSON string
 */
function safeJsonStringify(data) {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.warn('Failed to stringify JSON:', data, error.message);
    return '{}';
  }
}

module.exports = {
  safeJsonParse,
  safeJsonArray,
  safeJsonObject,
  safeJsonStringify
};