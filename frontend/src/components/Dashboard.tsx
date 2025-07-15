import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, BarChart3, Bell, Settings, Search, User } from 'lucide-react';
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
  
  const metals: Metal[] = [
    {
      symbol: 'XAU',
      name: 'Gold',
      price: prices?.gold?.price || 5432.50,
      change: prices?.gold?.change || 125.30,
      changePercent: prices?.gold?.changePercent || 2.36,
      high: prices?.gold?.high || 5445.20,
      low: prices?.gold?.low || 5380.10,
      color: '#FFD700'
    },
    {
      symbol: 'XAG',
      name: 'Silver',
      price: prices?.silver?.price || 82.40,
      change: prices?.silver?.change || -0.65,
      changePercent: prices?.silver?.changePercent || -0.78,
      high: prices?.silver?.high || 84.20,
      low: prices?.silver?.low || 81.90,
      color: '#C0C0C0'
    },
    {
      symbol: 'XPT',
      name: 'Platinum',
      price: prices?.platinum?.price || 2890.30,
      change: prices?.platinum?.change || 34.80,
      changePercent: prices?.platinum?.changePercent || 1.22,
      high: prices?.platinum?.high || 2910.50,
      low: prices?.platinum?.low || 2850.20,
      color: '#E5E4E2'
    },
    {
      symbol: 'XPD',
      name: 'Palladium',
      price: prices?.palladium?.price || 1890.40,
      change: prices?.palladium?.change || -15.60,
      changePercent: prices?.palladium?.changePercent || -0.82,
      high: prices?.palladium?.high || 1920.80,
      low: prices?.palladium?.low || 1875.30,
      color: '#CED0DD'
    }
  ];

  const timeframes = ['1H', '4H', '1D', '1W', '1M', '3M', '1Y'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900">SwarnaAI</h1>
              </div>
              <div className="hidden md:flex items-center space-x-1 text-xs text-slate-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Market Data</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search metals, news..."
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <User className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metals.map((metal, index) => (
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
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 capitalize">
                    {selectedMetal} Price Chart
                  </h2>
                  <p className="text-sm text-slate-500">Real-time price movements</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {timeframes.map((timeframe) => (
                    <button
                      key={timeframe}
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                        selectedTimeframe === timeframe
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {timeframe}
                    </button>
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
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">AI Assistant</h3>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3">
                  <p className="text-sm text-slate-700">
                    💡 Gold prices are showing strong upward momentum. Consider the 2.36% increase in today's trading.
                  </p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-slate-700">
                    📊 Silver is experiencing slight volatility. Historical data suggests potential recovery.
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Ask about market trends..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <button className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
                  Ask
                </button>
              </div>
            </motion.div>

            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Historical Data</h3>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Calendar className="h-5 w-5" />
                </button>
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
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Market Insights</h3>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Bullish Trend</p>
                    <p className="text-xs text-slate-500">Gold shows consistent upward movement</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Silver Correction</p>
                    <p className="text-xs text-slate-500">Minor pullback expected to stabilize</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <BarChart3 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Volume Analysis</p>
                    <p className="text-xs text-slate-500">Higher than average trading activity</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <p className="text-xs text-slate-600">
                  💡 <strong>AI Recommendation:</strong> Consider dollar-cost averaging for long-term positions.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;