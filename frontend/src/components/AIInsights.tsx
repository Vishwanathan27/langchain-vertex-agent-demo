import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, AlertCircle, Lightbulb, Send } from 'lucide-react';

interface AIInsightsProps {
  selectedMetal: string;
  currentPrice: number;
  priceChange: number;
}

interface Insight {
  id: string;
  type: 'trend' | 'prediction' | 'alert' | 'recommendation';
  title: string;
  message: string;
  confidence: number;
  timestamp: Date;
}

const AIInsights: React.FC<AIInsightsProps> = ({ selectedMetal, currentPrice, priceChange }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{sender: 'user' | 'ai', message: string, timestamp: Date}>>([]);

  // Generate AI insights based on current market data
  const generateInsights = () => {
    const newInsights: Insight[] = [];
    
    // Trend analysis
    if (priceChange > 0) {
      newInsights.push({
        id: '1',
        type: 'trend',
        title: 'Bullish Momentum',
        message: `${selectedMetal.charAt(0).toUpperCase() + selectedMetal.slice(1)} is showing strong upward momentum with a ${priceChange.toFixed(2)}% increase. Technical indicators suggest continued growth.`,
        confidence: 85,
        timestamp: new Date()
      });
    } else if (priceChange < 0) {
      newInsights.push({
        id: '1',
        type: 'trend',
        title: 'Market Correction',
        message: `${selectedMetal.charAt(0).toUpperCase() + selectedMetal.slice(1)} is experiencing a ${Math.abs(priceChange).toFixed(2)}% decline. This appears to be a healthy correction in the upward trend.`,
        confidence: 78,
        timestamp: new Date()
      });
    }

    // Price prediction
    newInsights.push({
      id: '2',
      type: 'prediction',
      title: 'Price Forecast',
      message: `Based on historical patterns and current market conditions, ${selectedMetal} is expected to reach ₹${(currentPrice * 1.05).toFixed(2)} within the next 7 days.`,
      confidence: 72,
      timestamp: new Date()
    });

    // Investment recommendation
    newInsights.push({
      id: '3',
      type: 'recommendation',
      title: 'Investment Strategy',
      message: `Consider dollar-cost averaging for ${selectedMetal} investments. Current market volatility presents good entry opportunities for long-term positions.`,
      confidence: 80,
      timestamp: new Date()
    });

    // Market alert
    if (Math.abs(priceChange) > 2) {
      newInsights.push({
        id: '4',
        type: 'alert',
        title: 'Significant Price Movement',
        message: `${selectedMetal.charAt(0).toUpperCase() + selectedMetal.slice(1)} has moved more than 2% in the current session. Monitor for potential volatility.`,
        confidence: 95,
        timestamp: new Date()
      });
    }

    return newInsights;
  };

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setInsights(generateInsights());
      setLoading(false);
    }, 500);
  }, [selectedMetal, currentPrice, priceChange]);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    const userMessage = {
      sender: 'user' as const,
      message: question,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setQuestion('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        sender: 'ai' as const,
        message: generateAIResponse(question),
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const generateAIResponse = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('price') || lowerQuery.includes('cost')) {
      return `Current ${selectedMetal} price is ₹${currentPrice.toLocaleString('en-IN')}. Based on technical analysis, we're seeing ${priceChange > 0 ? 'bullish' : 'bearish'} momentum. Consider market timing for optimal entry points.`;
    }
    
    if (lowerQuery.includes('buy') || lowerQuery.includes('invest')) {
      return `For ${selectedMetal} investments, I recommend a dollar-cost averaging strategy. Current market conditions suggest ${priceChange > 0 ? 'strong fundamentals' : 'potential value opportunities'}. Always diversify your portfolio and consult with a financial advisor.`;
    }
    
    if (lowerQuery.includes('trend') || lowerQuery.includes('forecast')) {
      return `Market trends indicate ${selectedMetal} is ${priceChange > 0 ? 'in an upward trajectory' : 'experiencing normal market fluctuations'}. Historical data suggests potential for ${Math.random() > 0.5 ? 'continued growth' : 'consolidation'} in the coming weeks.`;
    }
    
    return `Based on current market analysis for ${selectedMetal}, I recommend monitoring key support and resistance levels. The current price movement of ${priceChange.toFixed(2)}% suggests ${priceChange > 0 ? 'positive market sentiment' : 'potential buying opportunities'}. Always consider your risk tolerance and investment timeline.`;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return priceChange > 0 ? TrendingUp : TrendingDown;
      case 'prediction':
        return Brain;
      case 'alert':
        return AlertCircle;
      case 'recommendation':
        return Lightbulb;
      default:
        return Brain;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend':
        return priceChange > 0 ? 'text-green-600' : 'text-red-600';
      case 'prediction':
        return 'text-blue-600';
      case 'alert':
        return 'text-yellow-600';
      case 'recommendation':
        return 'text-purple-600';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Insights */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center space-x-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <span>AI Market Insights</span>
        </h3>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, index) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${getInsightColor(insight.type)}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-slate-900">{insight.title}</h4>
                        <span className="text-xs text-slate-500">{insight.confidence}% confidence</span>
                      </div>
                      <p className="text-sm text-slate-600">{insight.message}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <div className="w-full bg-slate-200 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full transition-all duration-300 ${
                              insight.confidence > 80 ? 'bg-green-500' : 
                              insight.confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${insight.confidence}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Chat */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Ask AI Assistant</h3>
        
        <div className="bg-white border border-slate-200 rounded-lg">
          {/* Chat History */}
          <div className="max-h-64 overflow-y-auto p-4 space-y-3">
            {chatHistory.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Ask me anything about {selectedMetal} markets!</p>
              </div>
            ) : (
              chatHistory.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.sender === 'user' 
                      ? 'bg-amber-500 text-white' 
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {message.message}
                  </div>
                </motion.div>
              ))
            )}
          </div>
          
          {/* Chat Input */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about market trends, prices, or investment advice..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
              />
              <button
                onClick={handleAskQuestion}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-yellow-800">
              <strong>Disclaimer:</strong> This is AI-generated market analysis for educational purposes only. 
              Always consult with a qualified financial advisor before making investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;