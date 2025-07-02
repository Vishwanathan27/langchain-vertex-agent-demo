// Helper for Vertex AI authentication using local service account or secret manager
const { VertexAI } = require('@langchain/google-vertexai');
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

async function retrieveVertexAISecret() {
  // TODO: Replace with real secret manager fetch in production
  // For now, mock with a resolved Promise (simulate secret fetch)
  return process.env.VERTEXAI_SECRET_JSON || '{}';
}

async function getCredentials() {
  if (process.env.NODE_ENV === 'production') {
    const secretJson = await retrieveVertexAISecret();
    return JSON.parse(secretJson);
  } else {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credPath) throw new Error('GOOGLE_APPLICATION_CREDENTIALS not set in .env');
    const absPath = path.resolve(__dirname, '..', '..', credPath);
    return JSON.parse(fs.readFileSync(absPath, 'utf8'));
  }
}

async function getVertexClient() {
  const credentials = await getCredentials();
  return new VertexAI({
    project: process.env.PROJECT_ID,
    location: process.env.LOCATION,
    googleAuthOptions: {
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    },
  });
}

async function getVertexAIToken() {
  const credentials = await getCredentials();
  const authClient = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const token = await authClient.getAccessToken();
  return token;
}

module.exports = {
  getVertexClient,
  getVertexAIToken,
  getCredentials,
  retrieveVertexAISecret,
};
