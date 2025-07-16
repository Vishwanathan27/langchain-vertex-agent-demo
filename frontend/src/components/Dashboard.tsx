import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, BarChart3, Bell, Settings, Search, User, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetalCard from './MetalCard';
import PriceChart from './PriceChart';
import HistoricalCalendar from './HistoricalCalendar';
import AIInsights from './AIInsights';
import { useRealTimePrices } from '../hooks/useRealTimePrices';

interface Metal {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  color: string;
}

const Dashboard: React.FC = () => {
  const [selectedMetal, setSelectedMetal] = useState<string>('gold');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1D');
  const [showCalendar, setShowCalendar] = useState(false);
  
  const { prices, loading, error } = useRealTimePrices();
  const { theme, toggleTheme, isDark } = useTheme();
  
  // Only show metals data if we have real API data
  const metals: Metal[] = [];
  
  if (prices && !loading) {
    if (prices.gold && !prices.gold.error) {
      metals.push({
        symbol: 'XAU',
        name: 'Gold',
        price: prices.gold.price,
        change: prices.gold.change,
        changePercent: prices.gold.changePercent,
        high: prices.gold.high,
        low: prices.gold.low,
        color: '#FFD700'
      });
    }
    
    if (prices.silver && !prices.silver.error) {
      metals.push({
        symbol: 'XAG',
        name: 'Silver',
        price: prices.silver.price,
        change: prices.silver.change,
        changePercent: prices.silver.changePercent,
        high: prices.silver.high,
        low: prices.silver.low,
        color: '#C0C0C0'
      });
    }
    
    if (prices.platinum && !prices.platinum.error) {
      metals.push({
        symbol: 'XPT',
        name: 'Platinum',
        price: prices.platinum.price,
        change: prices.platinum.change,
        changePercent: prices.platinum.changePercent,
        high: prices.platinum.high,
        low: prices.platinum.low,
        color: '#E5E4E2'
      });
    }
    
    if (prices.palladium && !prices.palladium.error) {
      metals.push({
        symbol: 'XPD',
        name: 'Palladium',
        price: prices.palladium.price,
        change: prices.palladium.change,
        changePercent: prices.palladium.changePercent,
        high: prices.palladium.high,
        low: prices.palladium.low,
        color: '#CED0DD'
      });
    }
  }

  const timeframes = ['1H', '4H', '1D', '1W', '1M', '3M', '1Y'];

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
              <motion.button 
                onClick={toggleTheme}
                className={`p-2 transition-all duration-300 rounded-lg hover:scale-110 ${
                  isDark 
                    ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-700' 
                    : 'text-slate-600 hover:text-amber-600 hover:bg-slate-100'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.button>
              <button className={`p-2 transition-colors duration-300 rounded-lg hover:scale-110 ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}>
                <Bell className="h-5 w-5" />
              </button>
              <button className={`p-2 transition-colors duration-300 rounded-lg hover:scale-110 ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}>
                <Settings className="h-5 w-5" />
              </button>
              <button className={`p-2 transition-colors duration-300 rounded-lg hover:scale-110 ${
                isDark 
                  ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}>
                <User className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <motion.div 
                  className={`rounded-lg p-3 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gradient-to-r from-amber-900/20 to-yellow-900/20' 
                      : 'bg-gradient-to-r from-amber-50 to-yellow-50'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    💡 Gold prices are showing strong upward momentum. Consider the 2.36% increase in today's trading.
                  </p>
                </motion.div>
                
                <motion.div 
                  className={`rounded-lg p-3 transition-all duration-300 ${
                    isDark 
                      ? 'bg-blue-900/20' 
                      : 'bg-blue-50'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-gray-300' : 'text-slate-700'
                  }`}>
                    📊 Silver is experiencing slight volatility. Historical data suggests potential recovery.
                  </p>
                </motion.div>
              </div>
              
              <div className="mt-4 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Ask about market trends..."
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 ${
                    isDark 
                      ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                      : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                  }`}
                />
                <motion.button 
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Ask
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
                <motion.div 
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>Bullish Trend</p>
                    <p className={`text-xs transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-slate-500'
                    }`}>Gold shows consistent upward movement</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>Silver Correction</p>
                    <p className={`text-xs transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-slate-500'
                    }`}>Minor pullback expected to stabilize</p>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <BarChart3 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className={`text-sm font-medium transition-colors duration-300 ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>Volume Analysis</p>
                    <p className={`text-xs transition-colors duration-300 ${
                      isDark ? 'text-gray-400' : 'text-slate-500'
                    }`}>Higher than average trading activity</p>
                  </div>
                </motion.div>
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
                  💡 <strong>AI Recommendation:</strong> Consider dollar-cost averaging for long-term positions.
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