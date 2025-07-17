# AI Integration Documentation

## Overview

SwarnaAI integrates Google Vertex AI (Gemini 2.5-flash) to provide intelligent market analysis, automated insights, and context-aware chat functionality. This document covers the complete AI integration architecture, implementation details, and usage patterns.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  Google Cloud   │
│                 │    │                 │    │                 │
│ • useAI Hook    │───▶│ • AI Routes     │───▶│ • Vertex AI     │
│ • Components    │    │ • AI Service    │    │ • Gemini Model  │
│ • Error Handle  │◄───│ • Data Layer    │◄───│ • Service Acc   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Database      │
                       │                 │
                       │ • Market Data   │
                       │ • Price History │
                       │ • Cache Layer   │
                       └─────────────────┘
```

## Features

### 1. AI Assistant Insights
- **Purpose**: Automated market analysis and trading insights
- **Frequency**: Real-time updates every 5 minutes
- **Data Source**: Live market data from database
- **Output**: Array of concise, actionable insights

### 2. Market Insights
- **Purpose**: Structured market analysis with recommendations
- **Components**: Market trends, volume analysis, price patterns
- **Format**: Categorized insights with confidence levels
- **AI Recommendation**: Strategic guidance based on current conditions

### 3. Contextual Chat
- **Purpose**: Interactive AI assistant for user queries
- **Context Awareness**: Understands user's selected metals and preferences
- **Safety**: Includes disclaimers and refers to financial advisors
- **Real-time**: Uses current market data for responses

## Implementation

### Backend Services

#### AI Insights Service (`/backend/src/services/aiInsightsService.js`)

```javascript
class AIInsightsService {
  constructor() {
    this.initializeVertexAI();
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash" 
    });
  }

  async generateAssistantInsights() {
    const marketData = await this.getCurrentMarketData();
    const prompt = this.buildAssistantPrompt(marketData);
    const response = await this.model.invoke(prompt);
    return this.parseAssistantResponse(response.content);
  }

  async generateMarketInsights() {
    const marketData = await this.getCurrentMarketData();
    const prompt = this.buildMarketInsightsPrompt(marketData);
    const response = await this.model.invoke(prompt);
    return this.parseMarketInsightsResponse(response.content);
  }

  async chatWithContext(query, context = {}) {
    const marketData = await this.getCurrentMarketData();
    const prompt = this.buildChatPrompt(query, context, marketData);
    const response = await this.model.invoke(prompt);
    return response.content;
  }
}
```

#### API Routes (`/backend/src/routes/ai.js`)

```javascript
// AI Assistant Insights
router.get('/assistant', async (req, res) => {
  try {
    const insights = await aiInsightsService.generateAssistantInsights();
    res.json({
      success: true,
      data: { insights },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Market Insights
router.get('/market-insights', async (req, res) => {
  try {
    const insights = await aiInsightsService.generateMarketInsights();
    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// AI Chat
router.post('/chat', async (req, res) => {
  try {
    const { query, context } = req.body;
    const response = await aiInsightsService.chatWithContext(query, context);
    res.json({
      success: true,
      query,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Frontend Integration

#### AI Hook (`/frontend/src/hooks/useAI.ts`)

```typescript
export const useAI = (refreshInterval: number = 5 * 60 * 1000): UseAIReturn => {
  const [aiInsights, setAiInsights] = useState<string[]>([
    "💡 Loading AI insights...",
    "📊 Analyzing market data..."
  ]);

  const refreshAIInsights = useCallback(async () => {
    try {
      setAiInsightsLoading(true);
      const response = await ApiClient.get(API_ENDPOINTS.AI.ASSISTANT);
      
      // Dual parsing for response structure compatibility
      if (response.success && response.data?.data?.insights) {
        setAiInsights(response.data.data.insights);
      } else if (response.success && response.data?.insights) {
        setAiInsights(response.data.insights);
      } else {
        throw new Error('Failed to fetch AI insights - unexpected response structure');
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      // Fallback to default insights
      setAiInsights([
        "💡 Gold prices are tracking market sentiment",
        "📊 Silver showing typical correlation patterns"
      ]);
    } finally {
      setAiInsightsLoading(false);
    }
  }, []);

  return {
    aiInsights,
    aiInsightsLoading,
    refreshAIInsights,
    marketInsights,
    chatWithAI
  };
};
```

#### Component Integration

```typescript
// AI Assistant Card
const AIAssistantCard: React.FC = () => {
  const { aiInsights, aiInsightsLoading, refreshAIInsights } = useAI();

  return (
    <Card className="ai-assistant-card">
      <CardHeader>
        <h3>🤖 AI Assistant</h3>
        <RefreshButton onClick={refreshAIInsights} loading={aiInsightsLoading} />
      </CardHeader>
      <CardContent>
        {aiInsights.map((insight, index) => (
          <InsightItem key={index} text={insight} />
        ))}
      </CardContent>
    </Card>
  );
};
```

## Configuration

### Environment Variables

```env
# Google Cloud AI Configuration
GOOGLE_APPLICATION_CREDENTIALS=service-account.json
PROJECT_ID=your-project-id
LOCATION=us-central1

# AI Service Configuration
AI_MODEL=gemini-2.5-flash
AI_TEMPERATURE=0.3
AI_MAX_TOKENS=1000
AI_TIMEOUT=30000

# Cache Configuration
AI_CACHE_TTL=300000  # 5 minutes
AI_RATE_LIMIT=60     # requests per minute
```

### Service Account Setup

1. **Create Service Account** in Google Cloud Console
2. **Download JSON Key** and save as `service-account.json`
3. **Grant Permissions**: Vertex AI User role
4. **Set Environment Variable**: `GOOGLE_APPLICATION_CREDENTIALS`

```bash
# Set up service account
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

## Prompt Engineering

### Assistant Insights Prompt

```javascript
buildAssistantPrompt(marketData) {
  return `As SwarnaAI, provide exactly 2 brief insights about precious metals:

Current Market Data:
${JSON.stringify(marketData, null, 2)}

Requirements:
- Each insight: max 60 characters
- Focus on gold and silver primarily
- Include price and change info
- Use ₹ for Indian Rupees
- Be concise and actionable

Format: Return as JSON array of strings.`;
}
```

### Market Insights Prompt

```javascript
buildMarketInsightsPrompt(marketData) {
  return `Analyze precious metals market and provide structured insights:

Market Data:
${JSON.stringify(marketData, null, 2)}

Provide:
1. 3 market insights with title and description
2. One AI recommendation
3. Overall market sentiment

Format as JSON:
{
  "insights": [
    {"title": "CATEGORY_NAME", "description": "Brief description"}
  ],
  "aiRecommendation": "Strategic guidance",
  "sentiment": "bullish|bearish|neutral"
}`;
}
```

### Chat Prompt

```javascript
buildChatPrompt(query, context, marketData) {
  return `You are SwarnaAI, a precious metals market assistant.

User Query: "${query}"
Context: ${JSON.stringify(context)}
Current Market Data: ${JSON.stringify(marketData)}

Guidelines:
- Provide helpful market information
- Use current data in responses
- Include disclaimers for investment advice
- Be concise and professional
- End with: "This is AI-generated analysis. Consult a financial advisor for investment decisions."`;
}
```

## Response Formats

### AI Assistant Response

```json
{
  "success": true,
  "data": {
    "insights": [
      "Gold flat at ₹287,703; watch for breakout signals.",
      "Silver stable; industrial demand key for next move."
    ]
  },
  "timestamp": "2025-07-17T06:30:00.000Z"
}
```

### Market Insights Response

```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "title": "MARKET_CONSOLIDATION",
        "description": "Gold and silver showing consolidation patterns."
      },
      {
        "title": "LOW_VOLATILITY", 
        "description": "Reduced volatility indicates stability."
      },
      {
        "title": "VOLUME_ANALYSIS",
        "description": "Trading volumes at normal levels."
      }
    ],
    "aiRecommendation": "Monitor for breakout signals; maintain neutral stance.",
    "sentiment": "neutral"
  },
  "timestamp": "2025-07-17T06:30:00.000Z"
}
```

### Chat Response

```json
{
  "success": true,
  "query": "What is the gold trend?",
  "response": "Based on current data, gold is stable at ₹287,703.55, showing 0% change. This indicates consolidation. Monitor for volume increases or news catalysts. This is AI-generated analysis. Consult a financial advisor for investment decisions.",
  "timestamp": "2025-07-17T06:30:00.000Z"
}
```

## Error Handling

### Frontend Error Handling

```typescript
// Comprehensive error handling with fallbacks
try {
  const response = await ApiClient.get(API_ENDPOINTS.AI.ASSISTANT);
  
  if (response.success && response.data?.data?.insights) {
    setAiInsights(response.data.data.insights);
  } else if (response.success && response.data?.insights) {
    setAiInsights(response.data.insights);
  } else {
    throw new Error('Unexpected response structure');
  }
} catch (error) {
  console.error('AI Error:', error);
  
  // Graceful fallback
  setAiInsights([
    "💡 Market analysis temporarily unavailable",
    "📊 Using cached insights"
  ]);
  
  setAiInsightsError(error.message);
}
```

### Backend Error Handling

```javascript
try {
  const response = await this.model.invoke(prompt);
  return this.parseResponse(response.content);
} catch (error) {
  console.error('Vertex AI Error:', error);
  
  // Return fallback insights
  if (error.code === 'QUOTA_EXCEEDED') {
    throw new Error('AI service temporarily unavailable');
  } else if (error.code === 'TIMEOUT') {
    throw new Error('AI request timed out');
  } else {
    throw new Error('AI service error');
  }
}
```

## Performance Optimization

### Caching Strategy

```javascript
class AIInsightsService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  async generateWithCache(key, generator) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
      return cached.data;
    }

    const data = await generator();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
}
```

### Rate Limiting

```javascript
// Rate limiting for AI requests
const rateLimit = require('express-rate-limit');

const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many AI requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

router.use('/ai/', aiRateLimit);
```

## Monitoring and Analytics

### AI Service Health

```javascript
// Health check endpoint
router.get('/ai/health', async (req, res) => {
  try {
    const healthStatus = await aiInsightsService.checkHealth();
    res.json({
      success: true,
      data: {
        status: 'healthy',
        vertexAiConnected: healthStatus.connected,
        lastSuccessfulCall: healthStatus.lastCall,
        averageResponseTime: healthStatus.avgResponseTime,
        errorRate: healthStatus.errorRate
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'AI service unhealthy'
    });
  }
});
```

### Logging

```javascript
// Structured logging for AI calls
console.log('🤖 AI Request:', {
  type: 'assistant_insights',
  timestamp: new Date().toISOString(),
  prompt_length: prompt.length,
  context: context
});

console.log('✅ AI Response:', {
  type: 'assistant_insights',
  response_length: response.length,
  processing_time: `${Date.now() - startTime}ms`,
  success: true
});
```

## Testing

### Unit Tests

```javascript
describe('AI Insights Service', () => {
  it('should generate assistant insights', async () => {
    const mockData = { gold: { price: 287703.55, change: 0 } };
    const insights = await aiService.generateAssistantInsights(mockData);
    
    expect(insights).toHaveLength(2);
    expect(insights[0]).toContain('Gold');
    expect(insights[1]).toContain('Silver');
  });

  it('should handle API errors gracefully', async () => {
    jest.spyOn(aiService.model, 'invoke').mockRejectedValue(new Error('API Error'));
    
    await expect(aiService.generateAssistantInsights()).rejects.toThrow('AI service error');
  });
});
```

### Integration Tests

```javascript
describe('AI Endpoints', () => {
  it('should return AI insights', async () => {
    const response = await request(app)
      .get('/api/metals/ai/assistant')
      .expect(200);
      
    expect(response.body.success).toBe(true);
    expect(response.body.data.insights).toHaveLength(2);
  });
});
```

## Best Practices

1. **Prompt Engineering**: Keep prompts concise and specific
2. **Error Handling**: Always provide fallback content
3. **Caching**: Cache AI responses to reduce API calls
4. **Rate Limiting**: Implement rate limiting for AI endpoints
5. **Monitoring**: Log all AI interactions for debugging
6. **Security**: Validate all user inputs before sending to AI
7. **Cost Management**: Monitor token usage and implement limits

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify service account credentials
   - Check PROJECT_ID environment variable
   - Ensure Vertex AI API is enabled

2. **Response Parsing Errors**
   - Check prompt formatting
   - Validate JSON response structure
   - Implement fallback parsing

3. **Rate Limiting**
   - Monitor API quotas
   - Implement exponential backoff
   - Use caching to reduce requests

4. **Performance Issues**
   - Optimize prompt length
   - Use caching effectively
   - Monitor response times

## Future Enhancements

1. **Advanced Analytics**: Sentiment analysis, price prediction
2. **Personalization**: User-specific insights and recommendations
3. **Multi-language**: Support for multiple languages
4. **Voice Integration**: Voice queries and responses
5. **Advanced Visualization**: AI-generated charts and graphs