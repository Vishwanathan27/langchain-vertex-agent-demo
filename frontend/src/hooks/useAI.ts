import { useState, useEffect, useCallback } from 'react';
import { ApiClient, API_ENDPOINTS } from '../config/api';

interface AIInsights {
  insights: string[];
}

interface MarketInsight {
  title: string;
  description: string;
}

interface MarketInsights {
  insights: MarketInsight[];
  aiRecommendation: string;
}

interface UseAIReturn {
  // AI Assistant
  aiInsights: string[];
  aiInsightsLoading: boolean;
  aiInsightsError: string | null;
  refreshAIInsights: () => Promise<void>;
  
  // Market Insights
  marketInsights: MarketInsights | null;
  marketInsightsLoading: boolean;
  marketInsightsError: string | null;
  refreshMarketInsights: () => Promise<void>;
  
  // Chat
  chatWithAI: (query: string, context?: any) => Promise<string>;
  isChatLoading: boolean;
  chatError: string | null;
}

export const useAI = (refreshInterval: number = 5 * 60 * 1000): UseAIReturn => {
  // AI Assistant Insights
  const [aiInsights, setAiInsights] = useState<string[]>([
    "💡 Loading AI insights...",
    "📊 Analyzing market data..."
  ]);
  const [aiInsightsLoading, setAiInsightsLoading] = useState(true);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);
  
  // Market Insights
  const [marketInsights, setMarketInsights] = useState<MarketInsights | null>(null);
  const [marketInsightsLoading, setMarketInsightsLoading] = useState(true);
  const [marketInsightsError, setMarketInsightsError] = useState<string | null>(null);
  
  // Chat
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Fetch AI Assistant Insights
  const refreshAIInsights = useCallback(async () => {
    try {
      setAiInsightsLoading(true);
      setAiInsightsError(null);
      
      console.log('🤖 Fetching AI insights...');
      const response = await ApiClient.get(API_ENDPOINTS.AI.ASSISTANT);
      console.log('🤖 AI Insights Response:', response);
      
      if (response.success && response.data?.data?.insights) {
        console.log('✅ Setting AI insights:', response.data.data.insights);
        setAiInsights(response.data.data.insights);
      } else if (response.success && response.data?.insights) {
        // Fallback: check if insights are directly in data
        console.log('✅ Setting AI insights (fallback):', response.data.insights);
        setAiInsights(response.data.insights);
      } else {
        console.error('❌ Unexpected response structure:', response);
        throw new Error(response.error || 'Failed to fetch AI insights - unexpected response structure');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error fetching AI insights:', errorMessage);
      setAiInsightsError(errorMessage);
      
      // Set fallback insights on error
      setAiInsights([
        "💡 Gold prices are tracking market sentiment and global factors",
        "📊 Silver showing typical precious metal correlation patterns"
      ]);
    } finally {
      setAiInsightsLoading(false);
    }
  }, []);

  // Fetch Market Insights
  const refreshMarketInsights = useCallback(async () => {
    try {
      setMarketInsightsLoading(true);
      setMarketInsightsError(null);
      
      console.log('📊 Fetching market insights...');
      const response = await ApiClient.get(API_ENDPOINTS.AI.MARKET_INSIGHTS);
      console.log('📊 Market Insights Response:', response);
      
      if (response.success && response.data?.data) {
        console.log('✅ Setting market insights:', response.data.data);
        setMarketInsights(response.data.data);
      } else if (response.success && response.data?.insights) {
        // Fallback: check if insights are directly in data
        console.log('✅ Setting market insights (fallback):', response.data);
        setMarketInsights(response.data);
      } else {
        console.error('❌ Unexpected market insights response structure:', response);
        throw new Error(response.error || 'Failed to fetch market insights - unexpected response structure');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error fetching market insights:', errorMessage);
      setMarketInsightsError(errorMessage);
      
      // Set fallback insights on error
      setMarketInsights({
        insights: [
          { title: "Market Trend", description: "Precious metals showing steady movement" },
          { title: "Price Action", description: "Current levels within normal ranges" },
          { title: "Volume Analysis", description: "Trading activity at expected levels" }
        ],
        aiRecommendation: "Monitor market conditions and consider diversified approach to precious metals investing."
      });
    } finally {
      setMarketInsightsLoading(false);
    }
  }, []);

  // Chat with AI
  const chatWithAI = useCallback(async (query: string, context?: any): Promise<string> => {
    try {
      setIsChatLoading(true);
      setChatError(null);
      
      console.log('💬 Sending chat message:', { query, context });
      const response = await ApiClient.post(API_ENDPOINTS.AI.CHAT, {
        query,
        context
      });
      console.log('💬 Chat Response:', response);
      
      if (response.success && response.data?.response) {
        console.log('✅ Chat response received:', response.data.response);
        return response.data.response;
      } else {
        console.error('❌ Unexpected chat response structure:', response);
        throw new Error(response.error || 'Failed to get AI response - unexpected response structure');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Error chatting with AI:', errorMessage);
      setChatError(errorMessage);
      throw new Error(`AI chat failed: ${errorMessage}`);
    } finally {
      setIsChatLoading(false);
    }
  }, []);

  // Initial load and interval refresh
  useEffect(() => {
    console.log('🤖 Initializing AI services...');
    
    // Initial load
    const initializeAI = async () => {
      await Promise.all([
        refreshAIInsights(),
        refreshMarketInsights()
      ]);
    };
    
    initializeAI();

    // Set up refresh interval
    const interval = setInterval(() => {
      console.log('🔄 Refreshing AI insights...');
      refreshAIInsights();
      refreshMarketInsights();
    }, refreshInterval);

    return () => {
      clearInterval(interval);
    };
  }, [refreshAIInsights, refreshMarketInsights, refreshInterval]);

  return {
    // AI Assistant
    aiInsights,
    aiInsightsLoading,
    aiInsightsError,
    refreshAIInsights,
    
    // Market Insights  
    marketInsights,
    marketInsightsLoading,
    marketInsightsError,
    refreshMarketInsights,
    
    // Chat
    chatWithAI,
    isChatLoading,
    chatError
  };
};