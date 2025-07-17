import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Brain, Target, RefreshCw } from 'lucide-react';
import { useAI } from '../../hooks/useAI';
import { useTheme } from '../../contexts/ThemeContext';
import GoldCard from '../common/GoldCard';
import GoldButton from '../common/GoldButton';
import LoadingSkeleton from '../common/LoadingSkeleton';

const MarketInsights: React.FC = () => {
  const { isDark } = useTheme();
  const {
    marketInsights,
    marketInsightsLoading,
    marketInsightsError,
    refreshMarketInsights
  } = useAI();

  const getIconAndColor = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('bull') || lowerTitle.includes('trend') || lowerTitle.includes('upward') || lowerTitle.includes('rise')) {
      return { icon: TrendingUp, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/20' };
    } else if (lowerTitle.includes('bear') || lowerTitle.includes('down') || lowerTitle.includes('correction') || lowerTitle.includes('fall')) {
      return { icon: TrendingDown, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/20' };
    } else {
      return { icon: BarChart3, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/20' };
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish':
        return 'text-green-500';
      case 'bearish':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <GoldCard gradient>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <motion.div
            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Brain className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Market Insights
            </h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              AI-powered analysis
            </p>
          </div>
        </div>
        
        <GoldButton
          variant="ghost"
          size="sm"
          onClick={refreshMarketInsights}
          isLoading={marketInsightsLoading}
          className="p-1"
        >
          <RefreshCw className="h-4 w-4" />
        </GoldButton>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {marketInsightsLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[1, 2, 3].map((index) => (
                <div key={index} className="flex items-start space-x-3">
                  <LoadingSkeleton width="w-4" height="h-4" className="mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <LoadingSkeleton height="h-4" />
                    <LoadingSkeleton height="h-3" width="w-3/4" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : marketInsights?.insights ? (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {marketInsights.insights.map((insight: any, index: number) => {
                const { icon: Icon, color, bgColor } = getIconAndColor(insight.title);
                
                return (
                  <motion.div 
                    key={index}
                    className={`
                      flex items-start space-x-3 p-3 rounded-lg transition-all duration-300
                      ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-slate-50'}
                    `}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ x: 4 }}
                  >
                    <motion.div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        ${bgColor}
                      `}
                      whileHover={{ scale: 1.1 }}
                    >
                      <Icon className={`h-4 w-4 ${color}`} />
                    </motion.div>
                    
                    <div className="flex-1">
                      <p className={`text-sm font-medium transition-colors duration-300 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {insight.title.replace(/_/g, ' ')}
                      </p>
                      <p className={`text-xs mt-1 transition-colors duration-300 ${
                        isDark ? 'text-gray-400' : 'text-slate-500'
                      }`}>
                        {insight.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {marketInsightsError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-xs rounded-lg p-3 ${
              isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
            }`}
          >
            ⚠️ {marketInsightsError}
          </motion.div>
        )}
      </div>

      {/* AI Recommendation */}
      {marketInsights?.aiRecommendation && (
        <motion.div 
          className={`
            mt-6 p-4 rounded-lg border-l-4 border-amber-500 transition-all duration-300
            ${isDark 
              ? 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20' 
              : 'bg-gradient-to-r from-blue-50 to-indigo-50'
            }
          `}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-start space-x-3">
            <motion.div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${isDark ? 'bg-amber-600/20' : 'bg-amber-100'}
              `}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Target className={`h-4 w-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            </motion.div>
            
            <div className="flex-1">
              <h4 className={`text-sm font-semibold mb-2 transition-colors duration-300 ${
                isDark ? 'text-amber-400' : 'text-amber-700'
              }`}>
                AI Recommendation
              </h4>
              <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                isDark ? 'text-gray-300' : 'text-slate-600'
              }`}>
                {marketInsights.aiRecommendation}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Market Sentiment Indicator */}
      {marketInsights?.sentiment && (
        <motion.div
          className="mt-4 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className={`
            inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium
            ${isDark ? 'bg-gray-700' : 'bg-slate-100'}
          `}>
            <div className={`w-2 h-2 rounded-full ${getSentimentColor(marketInsights.sentiment)}`} />
            <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>
              Market Sentiment: {marketInsights.sentiment.toUpperCase()}
            </span>
          </div>
        </motion.div>
      )}
    </GoldCard>
  );
};

export default MarketInsights;