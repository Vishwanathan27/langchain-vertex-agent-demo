/**
 * AI Insights Service
 * 
 * This service generates AI-powered market insights and recommendations
 * using Vertex AI and real market data from the database.
 * 
 * @author SwarnaAI Backend Team
 */

const { ChatVertexAI } = require('@langchain/google-vertexai');
const { loadCredentials } = require('../utils/googleCreds');
const dataService = require('./dataService');
const metalpricerService = require('./apiAbstraction');
const { createLogger } = require('../utils/logger');

const logger = createLogger('AIInsights');

class AIInsightsService {
  constructor() {
    this.model = null;
    this.initialized = false;
  }

  /**
   * Initialize the Vertex AI model
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const authClient = await loadCredentials();
      this.model = new ChatVertexAI({
        temperature: 0.3,
        model: process.env.MODEL || 'gemini-2.5-flash',
        project: process.env.PROJECT_ID,
        location: process.env.LOCATION,
        credentials: loadCredentials(),
        authClient,
        maxTokens: 1000
      });
      
      this.initialized = true;
      logger.info('AI Insights service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI Insights service:', error);
      throw error;
    }
  }

  /**
   * Generate AI assistant insights based on current market data
   */
  async generateAssistantInsights() {
    try {
      await this.initialize();

      // Get current market data
      const marketData = await this.getCurrentMarketData();
      if (!marketData) {
        return this.getDefaultInsights();
      }

      const prompt = this.buildAssistantPrompt(marketData);
      const response = await this.model.invoke(prompt);
      
      return this.parseAssistantResponse(response.content);
    } catch (error) {
      logger.error('Error generating assistant insights:', error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Generate market insights for the dashboard
   */
  async generateMarketInsights() {
    try {
      await this.initialize();

      // Get comprehensive market data
      const marketData = await this.getComprehensiveMarketData();
      if (!marketData) {
        return this.getDefaultMarketInsights();
      }

      const prompt = this.buildMarketInsightsPrompt(marketData);
      const response = await this.model.invoke(prompt);
      
      return this.parseMarketInsightsResponse(response.content);
    } catch (error) {
      logger.error('Error generating market insights:', error);
      return this.getDefaultMarketInsights();
    }
  }

  /**
   * Generate AI response to user questions
   */
  async generateAIResponse(userQuery, context = {}) {
    try {
      await this.initialize();

      const marketData = await this.getCurrentMarketData();
      const prompt = this.buildResponsePrompt(userQuery, marketData, context);
      const response = await this.model.invoke(prompt);
      
      return response.content;
    } catch (error) {
      logger.error('Error generating AI response:', error);
      return "I'm experiencing some technical difficulties. Please try again later.";
    }
  }

  /**
   * Get current market data from database and APIs
   */
  async getCurrentMarketData() {
    try {
      const [goldData, silverData, platinumData, palladiumData] = await Promise.all([
        dataService.getLatestPriceFromDB('XAU', 'INR'),
        dataService.getLatestPriceFromDB('XAG', 'INR'),
        dataService.getLatestPriceFromDB('XPT', 'INR'),
        dataService.getLatestPriceFromDB('XPD', 'INR')
      ]);

      return {
        gold: goldData,
        silver: silverData,
        platinum: platinumData,
        palladium: palladiumData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error fetching current market data:', error);
      return null;
    }
  }

  /**
   * Get comprehensive market data including historical trends
   */
  async getComprehensiveMarketData() {
    try {
      const currentData = await this.getCurrentMarketData();
      
      // Get historical data for trend analysis
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const [goldHistorical, silverHistorical] = await Promise.all([
        this.getHistoricalTrend('XAU', 'INR', 7), // Last 7 days
        this.getHistoricalTrend('XAG', 'INR', 7)
      ]);

      // Get volume and volatility data
      const volumeData = await this.getVolumeAnalysis();

      return {
        ...currentData,
        trends: {
          gold: goldHistorical,
          silver: silverHistorical
        },
        volume: volumeData
      };
    } catch (error) {
      logger.error('Error fetching comprehensive market data:', error);
      return null;
    }
  }

  /**
   * Get historical trend data for a metal
   */
  async getHistoricalTrend(metal, currency, days) {
    try {
      const db = require('../db/connection');
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const results = await db('metal_prices')
        .select('price', 'price_timestamp')
        .where({ metal, currency })
        .where('price_timestamp', '>=', startDate)
        .where('price_timestamp', '<=', endDate)
        .orderBy('price_timestamp', 'asc');

      if (results.length < 2) return null;

      const firstPrice = parseFloat(results[0].price);
      const lastPrice = parseFloat(results[results.length - 1].price);
      const change = lastPrice - firstPrice;
      const changePercent = (change / firstPrice) * 100;

      return {
        change,
        changePercent,
        trend: changePercent > 1 ? 'bullish' : changePercent < -1 ? 'bearish' : 'neutral',
        dataPoints: results.length
      };
    } catch (error) {
      logger.error('Error getting historical trend:', error);
      return null;
    }
  }

  /**
   * Analyze trading volume patterns
   */
  async getVolumeAnalysis() {
    try {
      // Since we don't have actual volume data, we'll simulate based on price volatility
      const db = require('../db/connection');
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const priceData = await db('metal_prices')
        .select('metal', 'price', 'price_timestamp')
        .where('price_timestamp', '>=', last24Hours)
        .orderBy('price_timestamp', 'desc');

      // Calculate volatility as a proxy for volume
      const volatility = this.calculateVolatility(priceData);
      
      return {
        level: volatility > 2 ? 'high' : volatility > 1 ? 'medium' : 'low',
        description: volatility > 2 ? 'Higher than average trading activity' : 
                    volatility > 1 ? 'Moderate trading activity' : 'Lower trading activity'
      };
    } catch (error) {
      logger.error('Error analyzing volume:', error);
      return { level: 'medium', description: 'Moderate trading activity' };
    }
  }

  /**
   * Calculate price volatility
   */
  calculateVolatility(priceData) {
    if (priceData.length < 2) return 0;

    const metalGroups = {};
    priceData.forEach(item => {
      if (!metalGroups[item.metal]) metalGroups[item.metal] = [];
      metalGroups[item.metal].push(parseFloat(item.price));
    });

    let totalVolatility = 0;
    let metalCount = 0;

    for (const metal in metalGroups) {
      const prices = metalGroups[metal];
      if (prices.length < 2) continue;

      const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
      const stdDev = Math.sqrt(variance);
      const volatility = (stdDev / mean) * 100;

      totalVolatility += volatility;
      metalCount++;
    }

    return metalCount > 0 ? totalVolatility / metalCount : 0;
  }

  /**
   * Build prompt for AI assistant insights
   */
  buildAssistantPrompt(marketData) {
    const goldPrice = marketData.gold?.price || 0;
    const silverPrice = marketData.silver?.price || 0;
    const goldChange = marketData.gold?.changePercent || 0;
    const silverChange = marketData.silver?.changePercent || 0;

    return `As an AI precious metals analyst, provide 2 brief insights for a trading dashboard AI assistant card.

Current Market Data:
- Gold: ₹${goldPrice} (${goldChange > 0 ? '+' : ''}${goldChange}%)
- Silver: ₹${silverPrice} (${silverChange > 0 ? '+' : ''}${silverChange}%)

Format your response as exactly 2 bullet points:
• [Insight about gold with specific percentage or price movement]
• [Insight about silver with market context]

Keep each insight under 80 characters. Focus on momentum, trends, and actionable observations.`;
  }

  /**
   * Build prompt for market insights
   */
  buildMarketInsightsPrompt(marketData) {
    const goldTrend = marketData.trends?.gold;
    const silverTrend = marketData.trends?.silver;
    const volume = marketData.volume;

    return `As a precious metals market analyst, provide 3 market insights and 1 AI recommendation.

Market Data:
- Gold trend: ${goldTrend?.trend || 'neutral'} (${goldTrend?.changePercent?.toFixed(2) || 0}% over 7 days)
- Silver trend: ${silverTrend?.trend || 'neutral'} (${silverTrend?.changePercent?.toFixed(2) || 0}% over 7 days)
- Volume: ${volume?.level || 'medium'} - ${volume?.description || 'Moderate activity'}

Format your response as:
INSIGHT1_TITLE
INSIGHT1_DESCRIPTION

INSIGHT2_TITLE  
INSIGHT2_DESCRIPTION

INSIGHT3_TITLE
INSIGHT3_DESCRIPTION

AI_RECOMMENDATION
RECOMMENDATION_TEXT

Keep titles under 20 characters and descriptions under 50 characters.`;
  }

  /**
   * Build prompt for user query responses
   */
  buildResponsePrompt(userQuery, marketData, context) {
    return `You are SwarnaAI, a helpful precious metals market assistant. Answer the user's question using current market data.

Current Market Data:
- Gold: ₹${marketData.gold?.price || 'N/A'} (${marketData.gold?.changePercent || 0}%)
- Silver: ₹${marketData.silver?.price || 'N/A'} (${marketData.silver?.changePercent || 0}%)
- Platinum: ₹${marketData.platinum?.price || 'N/A'}
- Palladium: ₹${marketData.palladium?.price || 'N/A'}

User Question: ${userQuery}

Provide a helpful, accurate response in 2-3 sentences. Include specific prices and percentages when relevant.
Always end with: "This is AI-generated analysis. Consult a financial advisor for investment decisions."`;
  }

  /**
   * Parse AI assistant response
   */
  parseAssistantResponse(response) {
    try {
      const lines = response.split('\n').filter(line => line.trim().startsWith('•'));
      const insights = lines.slice(0, 2).map(line => line.replace('•', '').trim());
      
      return {
        insights: insights.length === 2 ? insights : [
          "Gold prices showing market movement based on current data",
          "Silver displaying typical precious metal characteristics"
        ]
      };
    } catch (error) {
      logger.error('Error parsing assistant response:', error);
      return this.getDefaultInsights();
    }
  }

  /**
   * Parse market insights response
   */
  parseMarketInsightsResponse(response) {
    try {
      const sections = response.split('\n\n');
      const insights = [];
      let aiRecommendation = "Consider dollar-cost averaging for long-term positions.";

      for (let i = 0; i < Math.min(3, sections.length - 1); i++) {
        const lines = sections[i].split('\n');
        if (lines.length >= 2) {
          insights.push({
            title: lines[0].trim(),
            description: lines[1].trim()
          });
        }
      }

      // Extract AI recommendation
      const lastSection = sections[sections.length - 1];
      if (lastSection.includes('AI_RECOMMENDATION') || lastSection.includes('RECOMMENDATION')) {
        const lines = lastSection.split('\n');
        aiRecommendation = lines[lines.length - 1].trim();
      }

      return {
        insights: insights.length === 3 ? insights : this.getDefaultMarketInsights().insights,
        aiRecommendation
      };
    } catch (error) {
      logger.error('Error parsing market insights response:', error);
      return this.getDefaultMarketInsights();
    }
  }

  /**
   * Get default insights when AI is unavailable
   */
  getDefaultInsights() {
    return {
      insights: [
        "💡 Gold prices are tracking market sentiment and global factors",
        "📊 Silver showing typical precious metal correlation patterns"
      ]
    };
  }

  /**
   * Get default market insights
   */
  getDefaultMarketInsights() {
    return {
      insights: [
        { title: "Market Trend", description: "Precious metals showing steady movement" },
        { title: "Price Action", description: "Current levels within normal ranges" },
        { title: "Volume Analysis", description: "Trading activity at expected levels" }
      ],
      aiRecommendation: "Monitor market conditions and consider diversified approach to precious metals investing."
    };
  }

  /**
   * Health check for the AI service
   */
  async healthCheck() {
    try {
      await this.initialize();
      return { status: 'healthy', model: this.model?.modelName || 'unknown' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new AIInsightsService();