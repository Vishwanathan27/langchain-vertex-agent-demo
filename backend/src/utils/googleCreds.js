// Utility to load Google service account credentials as a parsed object
const fs = require('fs');
const path = require('path');

function loadCredentials() {
  const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json';
  const abs = path.isAbsolute(keyPath) ? keyPath : path.resolve(keyPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`service-account.json not found at ${abs}`);
  }
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

module.exports = { loadCredentials };
