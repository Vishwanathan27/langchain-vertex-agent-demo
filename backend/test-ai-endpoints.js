const express = require('express');
const cors = require('cors');
const aiInsightsService = require('./src/services/aiInsightsService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// AI Assistant endpoint
app.get('/api/metals/ai/assistant', async (req, res) => {
  try {
    console.log('🤖 AI Assistant endpoint called');
    const insights = await aiInsightsService.generateAssistantInsights();
    console.log('✅ Generated insights:', insights);
    
    const response = {
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Sending response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('❌ AI Assistant error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI insights'
    });
  }
});

// Market insights endpoint
app.get('/api/metals/ai/market-insights', async (req, res) => {
  try {
    console.log('📊 Market insights endpoint called');
    const insights = await aiInsightsService.generateMarketInsights();
    console.log('✅ Generated market insights:', insights);
    
    const response = {
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Sending response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('❌ Market insights error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate market insights'
    });
  }
});

// Chat endpoint
app.post('/api/metals/ai/chat', async (req, res) => {
  try {
    console.log('💬 Chat endpoint called with:', req.body);
    const { query, context } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const response_text = await aiInsightsService.generateAIResponse(query, context);
    console.log('✅ Generated chat response:', response_text);
    
    const response = {
      success: true,
      query,
      response: response_text,
      timestamp: new Date().toISOString()
    };
    
    console.log('📤 Sending response:', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate AI response'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`🚀 AI Test Server running on port ${PORT}`);
  console.log('🔗 Test endpoints:');
  console.log(`   GET  http://localhost:${PORT}/api/metals/ai/assistant`);
  console.log(`   GET  http://localhost:${PORT}/api/metals/ai/market-insights`);
  console.log(`   POST http://localhost:${PORT}/api/metals/ai/chat`);
  console.log(`   GET  http://localhost:${PORT}/health`);
});