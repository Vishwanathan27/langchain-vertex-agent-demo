// Helper to load Vertex AI client with service account credentials from .env
const { VertexAI } = require('@langchain/google-vertexai');
const fs = require('fs');
const path = require('path');

function getVertexClient() {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credPath) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set in .env');
  }
  const absPath = path.resolve(__dirname, '..', '..', credPath);
  let credentials;
  try {
    credentials = JSON.parse(fs.readFileSync(absPath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to load service account JSON at ${absPath}: ${err.message}`);
  }

  

  return new VertexAI({
    credentials,
    project: process.env.PROJECT_ID,
    location: process.env.LOCATION,
    model: process.env.MODEL,
  });
}

module.exports = {
  getVertexClient,
};
