import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, RefreshCw } from 'lucide-react';
import { useAI } from '../../hooks/useAI';
import { useTheme } from '../../contexts/ThemeContext';
import GoldCard from '../common/GoldCard';
import GoldButton from '../common/GoldButton';
import GoldInput from '../common/GoldInput';
import LoadingSkeleton from '../common/LoadingSkeleton';

interface AIAssistantProps {
  selectedMetal: string;
  currentPrices: any;
  timeframe: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  selectedMetal,
  currentPrices,
  timeframe
}) => {
  const { isDark } = useTheme();
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  
  const {
    aiInsights,
    aiInsightsLoading,
    aiInsightsError,
    refreshAIInsights,
    chatWithAI,
    isChatLoading,
    chatError
  } = useAI();

  const handleAiQuery = async () => {
    if (!aiQuery.trim() || isChatLoading) return;
    
    setAiResponse('');
    
    try {
      const response = await chatWithAI(aiQuery, {
        selectedMetal,
        currentPrices,
        timeframe
      });
      
      setAiResponse(response);
      setAiQuery('');
    } catch (error) {
      console.error('Error sending AI query:', error);
      setAiResponse('🤖 Sorry, I encountered an error. Please try again.');
    }
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAiQuery();
    }
  };

  return (
    <GoldCard gradient className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <motion.div
            className="w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-full flex items-center justify-center"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Bot className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              AI Assistant
            </h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Powered by Vertex AI
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.div 
            className="w-2 h-2 bg-green-500 rounded-full"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [1, 0.6, 1]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <GoldButton
            variant="ghost"
            size="sm"
            onClick={refreshAIInsights}
            isLoading={aiInsightsLoading}
            className="p-1"
          >
            <RefreshCw className="h-4 w-4" />
          </GoldButton>
        </div>
      </div>

      {/* AI Insights */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Sparkles className={`h-4 w-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
            Market Insights
          </span>
        </div>

        <AnimatePresence mode="wait">
          {aiInsightsLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {[1, 2].map((index) => (
                <div
                  key={index}
                  className={`rounded-lg p-3 ${
                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                  }`}
                >
                  <LoadingSkeleton height="h-4" />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {aiInsights.map((insight, index) => (
                <motion.div 
                  key={index}
                  className={`
                    rounded-lg p-3 border-l-4 transition-all duration-300
                    ${index === 0
                      ? `border-amber-500 ${
                          isDark 
                            ? 'bg-gradient-to-r from-amber-900/20 to-yellow-900/20' 
                            : 'bg-gradient-to-r from-amber-50 to-yellow-50'
                        }`
                      : `border-blue-500 ${
                          isDark 
                            ? 'bg-blue-900/20' 
                            : 'bg-blue-50'
                        }`
                    }
                  `}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                >
                  <p className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    {insight}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {aiInsightsError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-xs rounded-lg p-2 ${
              isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
            }`}
          >
            ⚠️ {aiInsightsError}
          </motion.div>
        )}
      </div>

      {/* AI Response Display */}
      <AnimatePresence>
        {aiResponse && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={`
              rounded-lg p-4 border-l-4 border-amber-500 transition-all duration-300
              ${isDark 
                ? 'bg-gradient-to-r from-gray-700/50 to-amber-900/10' 
                : 'bg-gradient-to-r from-amber-50 to-yellow-50'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              <Bot className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                isDark ? 'text-amber-400' : 'text-amber-600'
              }`} />
              <div className="flex-1">
                <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-slate-700'
                }`}>
                  {aiResponse}
                </p>
                <GoldButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setAiResponse('')}
                  className="mt-2 text-xs"
                >
                  Clear
                </GoldButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Input */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Send className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
            Ask AI Assistant
          </span>
        </div>

        <div className="flex items-end space-x-2">
          <GoldInput
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyPress={handleInputKeyPress}
            placeholder="Ask about market trends, price analysis..."
            disabled={isChatLoading}
            className="flex-1"
          />
          
          <GoldButton 
            onClick={handleAiQuery}
            disabled={isChatLoading || !aiQuery.trim()}
            isLoading={isChatLoading}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </GoldButton>
        </div>

        {chatError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-xs rounded-lg p-2 ${
              isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
            }`}
          >
            ⚠️ {chatError}
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {[
          'What is the gold trend?',
          'Silver vs Gold comparison',
          'Market sentiment analysis'
        ].map((suggestion, index) => (
          <GoldButton
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => setAiQuery(suggestion)}
            disabled={isChatLoading}
            className="text-xs"
          >
            {suggestion}
          </GoldButton>
        ))}
      </div>
    </GoldCard>
  );
};

export default AIAssistant;