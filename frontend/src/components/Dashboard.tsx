import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, BarChart3, Bell, Settings, Search, User, Moon, Sun, Filter } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetalCard from './MetalCard';
import PriceChart from './PriceChart';
import HistoricalCalendar from './HistoricalCalendar';
import UserProfile from './UserProfile';
import { useRealTimePrices } from '../hooks/useRealTimePrices';
import { useAI } from '../hooks/useAI';

interface Metal {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  color: string;
  price_gram_24k?: number;
  price_gram_22k?: number;
  price_gram_18k?: number;
  per_ounce_price?: number;
}

const Dashboard: React.FC = () => {
  const [selectedMetal, setSelectedMetal] = useState<string>('gold');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1D');
  const [showCalendar, setShowCalendar] = useState(false);
  const [priceDisplayMode, setPriceDisplayMode] = useState<'per_ounce' | 'gram_24k' | 'gram_22k' | 'gram_18k'>('per_ounce');
  const [showFilters, setShowFilters] = useState(false);
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string>('');
  
  const { prices, loading, error } = useRealTimePrices();
  const { theme, toggleTheme, isDark } = useTheme();
  
  // Use the centralized AI hook
  const {
    aiInsights,
    aiInsightsLoading,
    aiInsightsError,
    marketInsights,
    marketInsightsLoading,
    marketInsightsError,
    chatWithAI,
    isChatLoading,
    chatError
  } = useAI();
  
  // Only show metals data if we have real API data
  const metals: Metal[] = [];
  
  if (prices && !loading) {
    if (prices.gold && prices.gold.price) {
      metals.push({
        symbol: 'XAU',
        name: 'Gold',
        price: prices.gold.price,
        change: prices.gold.change,
        changePercent: prices.gold.changePercent,
        high: prices.gold.high,
        low: prices.gold.low,
        color: '#FFD700',
        price_gram_24k: prices.gold.price_gram_24k,
        price_gram_22k: prices.gold.price_gram_22k,
        price_gram_18k: prices.gold.price_gram_18k,
        per_ounce_price: prices.gold.per_ounce_price
      });
    }
    
    if (prices.silver && prices.silver.price) {
      metals.push({
        symbol: 'XAG',
        name: 'Silver',
        price: prices.silver.price,
        change: prices.silver.change,
        changePercent: prices.silver.changePercent,
        high: prices.silver.high,
        low: prices.silver.low,
        color: '#C0C0C0',
        price_gram_24k: prices.silver.price_gram_24k,
        price_gram_22k: prices.silver.price_gram_22k,
        price_gram_18k: prices.silver.price_gram_18k,
        per_ounce_price: prices.silver.per_ounce_price
      });
    }
    
    if (prices.platinum && prices.platinum.price) {
      metals.push({
        symbol: 'XPT',
        name: 'Platinum',
        price: prices.platinum.price,
        change: prices.platinum.change,
        changePercent: prices.platinum.changePercent,
        high: prices.platinum.high,
        low: prices.platinum.low,
        color: '#E5E4E2',
        price_gram_24k: prices.platinum.price_gram_24k,
        price_gram_22k: prices.platinum.price_gram_22k,
        price_gram_18k: prices.platinum.price_gram_18k,
        per_ounce_price: prices.platinum.per_ounce_price
      });
    }
    
    if (prices.palladium && prices.palladium.price) {
      metals.push({
        symbol: 'XPD',
        name: 'Palladium',
        price: prices.palladium.price,
        change: prices.palladium.change,
        changePercent: prices.palladium.changePercent,
        high: prices.palladium.high,
        low: prices.palladium.low,
        color: '#CED0DD',
        price_gram_24k: prices.palladium.price_gram_24k,
        price_gram_22k: prices.palladium.price_gram_22k,
        price_gram_18k: prices.palladium.price_gram_18k,
        per_ounce_price: prices.palladium.per_ounce_price
      });
    }
  }

  const timeframes = ['1H', '4H', '1D', '1W', '1M', '3M', '1Y'];

  // Handle AI chat
  const handleAiQuery = async () => {
    if (!aiQuery.trim() || isChatLoading) return;
    
    setAiResponse('');
    
    try {
      const response = await chatWithAI(aiQuery, {
        selectedMetal,
        currentPrices: prices,
        timeframe: selectedTimeframe
      });
      
      setAiResponse(response);
      setAiQuery(''); // Clear input after successful response
    } catch (error) {
      console.error('Error sending AI query:', error);
      setAiResponse('Sorry, I encountered an error. Please try again.');
    }
  };

  // Handle Enter key in AI input
  const handleAiInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAiQuery();
    }
  };

  return (
    <motion.div 
      className={`min-h-screen transition-all duration-500 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-slate-50 to-slate-100'
      }`}
      animate={{
        background: isDark 
          ? 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
      }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.header 
        className={`shadow-sm border-b transition-all duration-300 ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-slate-200'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h1 className={`text-xl font-bold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>SwarnaAI</h1>
              </div>
              <div className={`hidden md:flex items-center space-x-1 text-xs transition-colors duration-300 ${
                isDark ? 'text-gray-400' : 'text-slate-500'
              }`}>
                <motion.div 
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <span>Live Market Data</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className={`absolute left-3 top-3 h-4 w-4 transition-colors duration-300 ${
                  isDark ? 'text-gray-400' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search metals, news..."
                  className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 ${
                    isDark 
                      ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                      : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
              <button className={`p-2 transition-colors duration-300 rounded-lg hover:scale-110 ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}>
                <Bell className="h-5 w-5" />
              </button>
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 transition-colors duration-300 rounded-lg hover:scale-110 ${
                  isDark 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Filter className="h-5 w-5" />
              </motion.button>
              <button className={`p-2 transition-colors duration-300 rounded-lg hover:scale-110 ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}>
                <Settings className="h-5 w-5" />
              </button>
              <UserProfile />
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Price Display Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`rounded-xl shadow-lg p-6 mb-6 transition-all duration-300 ${
              isDark 
                ? 'bg-gray-800 shadow-gray-900/20' 
                : 'bg-white shadow-gray-200/50'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Price Display Options</h3>
              <button
                onClick={() => setShowFilters(false)}
                className={`text-sm transition-colors duration-300 ${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Hide
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'per_ounce', label: 'Per Ounce', desc: 'Traditional trading unit' },
                { value: 'gram_24k', label: '24K Gold/Gram', desc: 'Pure gold per gram' },
                { value: 'gram_22k', label: '22K Gold/Gram', desc: 'Jewelry grade per gram' },
                { value: 'gram_18k', label: '18K Gold/Gram', desc: 'Lower purity per gram' }
              ].map(({ value, label, desc }) => (
                <motion.button
                  key={value}
                  onClick={() => setPriceDisplayMode(value as any)}
                  className={`p-3 rounded-lg border-2 transition-all duration-300 text-left ${
                    priceDisplayMode === value
                      ? isDark
                        ? 'border-amber-500 bg-amber-900/20 text-amber-400'
                        : 'border-amber-500 bg-amber-50 text-amber-700'
                      : isDark
                        ? 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                        : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="font-medium text-sm">{label}</div>
                  <div className={`text-xs mt-1 ${
                    priceDisplayMode === value
                      ? isDark ? 'text-amber-300' : 'text-amber-600'
                      : isDark ? 'text-gray-400' : 'text-slate-500'
                  }`}>{desc}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Metal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading ? (
            // Loading skeleton cards
            [1, 2, 3, 4].map((index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-xl shadow-lg p-6 transition-all duration-300 ${
                  isDark 
                    ? 'bg-gray-800 shadow-gray-900/20' 
                    : 'bg-white shadow-gray-200/50'
                }`}
              >
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                      <div className="h-3 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-8 bg-gray-300 rounded w-32"></div>
                    <div className="h-6 bg-gray-300 rounded w-24"></div>
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : error ? (
            // Error state
            <div className="col-span-full flex items-center justify-center py-12">
              <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <p className="text-lg mb-2">⚠️ Unable to load market data</p>
                <p className="text-sm">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : metals.length === 0 ? (
            // No data state
            <div className="col-span-full flex items-center justify-center py-12">
              <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <p className="text-lg mb-2">📊 No market data available</p>
                <p className="text-sm">Please check your API configuration</p>
              </div>
            </div>
          ) : (
            // Actual metal cards
            metals.map((metal, index) => (
              <motion.div
                key={metal.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <MetalCard
                  metal={metal}
                  isSelected={selectedMetal === metal.name.toLowerCase()}
                  onClick={() => setSelectedMetal(metal.name.toLowerCase())}
                  priceDisplayMode={priceDisplayMode}
                />
              </motion.div>
            ))
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`rounded-xl shadow-lg p-6 transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-800 shadow-gray-900/20' 
                  : 'bg-white shadow-gray-200/50'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-xl font-semibold capitalize transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {selectedMetal} Price Chart
                  </h2>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-slate-500'
                  }`}>Real-time price movements</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {timeframes.map((timeframe) => (
                    <motion.button
                      key={timeframe}
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                        selectedTimeframe === timeframe
                          ? isDark 
                            ? 'bg-amber-600 text-white' 
                            : 'bg-amber-100 text-amber-700'
                          : isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {timeframe}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <PriceChart
                metal={selectedMetal}
                timeframe={selectedTimeframe}
              />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Chat */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-xl shadow-lg p-6 transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-800 shadow-gray-900/20' 
                  : 'bg-white shadow-gray-200/50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>AI Assistant</h3>
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
              </div>
              
              <div className="space-y-3">
                {aiInsightsLoading ? (
                  // Loading skeleton for insights
                  [1, 2].map((index) => (
                    <div
                      key={index}
                      className={`rounded-lg p-3 animate-pulse transition-all duration-300 ${
                        isDark ? 'bg-gray-700' : 'bg-gray-200'
                      }`}
                    >
                      <div className={`h-4 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                    </div>
                  ))
                ) : (
                  aiInsights.map((insight, index) => (
                    <motion.div 
                      key={index}
                      className={`rounded-lg p-3 transition-all duration-300 ${
                        index === 0
                          ? isDark 
                            ? 'bg-gradient-to-r from-amber-900/20 to-yellow-900/20' 
                            : 'bg-gradient-to-r from-amber-50 to-yellow-50'
                          : isDark 
                            ? 'bg-blue-900/20' 
                            : 'bg-blue-50'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <p className={`text-sm transition-colors duration-300 ${
                        isDark ? 'text-gray-300' : 'text-slate-700'
                      }`}>
                        {insight}
                      </p>
                    </motion.div>
                  ))
                )}
                
                {/* AI Response Display */}
                {aiResponse && (
                  <motion.div 
                    className={`rounded-lg p-3 border-l-4 border-amber-500 transition-all duration-300 ${
                      isDark 
                        ? 'bg-gray-700/50' 
                        : 'bg-amber-50'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className={`text-sm transition-colors duration-300 ${
                      isDark ? 'text-gray-300' : 'text-slate-700'
                    }`}>
                      🤖 {aiResponse}
                    </p>
                    <button
                      onClick={() => setAiResponse('')}
                      className={`mt-2 text-xs transition-colors duration-300 ${
                        isDark ? 'text-gray-400 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Clear
                    </button>
                  </motion.div>
                )}
              </div>
              
              <div className="mt-4 flex items-center space-x-2">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyPress={handleAiInputKeyPress}
                  placeholder="Ask about market trends..."
                  disabled={isChatLoading}
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 ${
                    isDark 
                      ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 disabled:opacity-50' 
                      : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400 disabled:opacity-50'
                  }`}
                />
                <motion.button 
                  onClick={handleAiQuery}
                  disabled={isChatLoading || !aiQuery.trim()}
                  className={`px-4 py-2 rounded-lg transition-colors duration-300 text-white ${
                    isChatLoading || !aiQuery.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                  whileHover={{ scale: isChatLoading || !aiQuery.trim() ? 1 : 1.05 }}
                  whileTap={{ scale: isChatLoading || !aiQuery.trim() ? 1 : 0.95 }}
                >
                  {isChatLoading ? 'Thinking...' : 'Ask'}
                </motion.button>
              </div>
            </motion.div>

            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className={`rounded-xl shadow-lg p-6 transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-800 shadow-gray-900/20' 
                  : 'bg-white shadow-gray-200/50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>Historical Data</h3>
                <motion.button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className={`p-2 transition-colors duration-300 rounded-lg ${
                    isDark 
                      ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Calendar className="h-5 w-5" />
                </motion.button>
              </div>
              
              <HistoricalCalendar
                selectedMetal={selectedMetal}
                onDateSelect={(date) => console.log('Selected date:', date)}
              />
            </motion.div>

            {/* Market Insights */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className={`rounded-xl shadow-lg p-6 transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-800 shadow-gray-900/20' 
                  : 'bg-white shadow-gray-200/50'
              }`}
            >
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>Market Insights</h3>
              
              <div className="space-y-3">
                {!marketInsights ? (
                  // Loading skeleton for market insights
                  [1, 2, 3].map((index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-4 h-4 mt-0.5 rounded animate-pulse ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                      <div className="flex-1 space-y-1">
                        <div className={`h-4 rounded animate-pulse ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                        <div className={`h-3 rounded animate-pulse w-3/4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                      </div>
                    </div>
                  ))
                ) : (
                  marketInsights.insights.map((insight: any, index: number) => {
                    const getIconAndColor = (title: string) => {
                      const lowerTitle = title.toLowerCase();
                      if (lowerTitle.includes('bull') || lowerTitle.includes('trend') || lowerTitle.includes('upward')) {
                        return { icon: TrendingUp, color: 'text-green-500' };
                      } else if (lowerTitle.includes('bear') || lowerTitle.includes('down') || lowerTitle.includes('correction')) {
                        return { icon: TrendingDown, color: 'text-red-500' };
                      } else {
                        return { icon: BarChart3, color: 'text-blue-500' };
                      }
                    };
                    
                    const { icon: Icon, color } = getIconAndColor(insight.title);
                    
                    return (
                      <motion.div 
                        key={index}
                        className="flex items-start space-x-3"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      >
                        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${color}`} />
                        <div>
                          <p className={`text-sm font-medium transition-colors duration-300 ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>{insight.title}</p>
                          <p className={`text-xs transition-colors duration-300 ${
                            isDark ? 'text-gray-400' : 'text-slate-500'
                          }`}>{insight.description}</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
              
              <motion.div 
                className={`mt-4 p-3 rounded-lg transition-all duration-300 ${
                  isDark 
                    ? 'bg-gradient-to-r from-blue-900/20 to-indigo-900/20' 
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <p className={`text-xs transition-colors duration-300 ${
                  isDark ? 'text-gray-300' : 'text-slate-600'
                }`}>
                  💡 <strong>AI Recommendation:</strong> {marketInsights?.aiRecommendation || 'Consider dollar-cost averaging for long-term positions.'}
                </p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;