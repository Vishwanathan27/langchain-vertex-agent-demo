/**
 * Logger Utility
 * 
 * Provides structured logging with different levels and context-aware formatting.
 * 
 * @author SwarnaAI Backend Team
 */

const createLogger = (context) => {
  const log = (level, message, ...args) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
    
    console.log(prefix, message, ...args);
  };

  return {
    info: (message, ...args) => log('info', message, ...args),
    warn: (message, ...args) => log('warn', message, ...args),
    error: (message, ...args) => log('error', message, ...args),
    debug: (message, ...args) => log('debug', message, ...args)
  };
};

module.exports = { createLogger };