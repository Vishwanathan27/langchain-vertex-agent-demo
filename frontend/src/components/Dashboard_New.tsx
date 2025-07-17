import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRealTimePrices } from '../hooks/useRealTimePrices';
import { useTheme } from '../contexts/ThemeContext';

// Layout Components
import DashboardHeader from './layout/DashboardHeader';

// Metal Components  
import MetalsGrid, { Metal } from './metals/MetalsGrid';
import PriceChart from './PriceChart';

// AI Components
import AIAssistant from './ai/AIAssistant';
import MarketInsights from './ai/MarketInsights';

// Common Components
import GoldCard from './common/GoldCard';
import GoldButton from './common/GoldButton';

// Other Components
import HistoricalCalendar from './HistoricalCalendar';
import PriceDisplayFilters from './filters/PriceDisplayFilters';

const Dashboard: React.FC = () => {
  // State Management
  const [selectedMetal, setSelectedMetal] = useState<string>('gold');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1D');
  const [showCalendar, setShowCalendar] = useState(false);
  const [priceDisplayMode, setPriceDisplayMode] = useState<'per_ounce' | 'gram_24k' | 'gram_22k' | 'gram_18k'>('per_ounce');
  const [showFilters, setShowFilters] = useState(false);
  
  // Hooks
  const { prices, loading, error } = useRealTimePrices();
  const { isDark } = useTheme();
  
  // Data Processing
  const metals: Metal[] = [];
  
  if (prices && !loading) {
    // Helper function to create metal object
    const createMetal = (metalData: any, name: string, symbol: string, color: string): Metal => ({
      symbol,
      name,
      price: metalData.price,
      change: metalData.change,
      changePercent: metalData.changePercent,
      high: metalData.high,
      low: metalData.low,
      color,
      price_gram_24k: metalData.price_gram_24k,
      price_gram_22k: metalData.price_gram_22k,
      price_gram_18k: metalData.price_gram_18k,
      per_ounce_price: metalData.per_ounce_price
    });

    if (prices.gold?.price) {
      metals.push(createMetal(prices.gold, 'Gold', 'XAU', '#FFD700'));
    }
    
    if (prices.silver?.price) {
      metals.push(createMetal(prices.silver, 'Silver', 'XAG', '#C0C0C0'));
    }
    
    if (prices.platinum?.price) {
      metals.push(createMetal(prices.platinum, 'Platinum', 'XPT', '#E5E4E2'));
    }
    
    if (prices.palladium?.price) {
      metals.push(createMetal(prices.palladium, 'Palladium', 'XPD', '#CED0DD'));
    }
  }

  const timeframes = ['1H', '4H', '1D', '1W', '1M', '3M', '1Y'];

  return (
    <motion.div 
      className={`min-h-screen transition-all duration-500 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100'
      }`}
      animate={{
        background: isDark 
          ? 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #fef3c7 20%, #f1f5f9 100%)'
      }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <DashboardHeader 
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Price Display Filters */}
        {showFilters && (
          <PriceDisplayFilters
            priceDisplayMode={priceDisplayMode}
            onModeChange={setPriceDisplayMode}
            onClose={() => setShowFilters(false)}
          />
        )}
        
        {/* Metal Cards Grid */}
        <MetalsGrid
          metals={metals}
          loading={loading}
          error={error}
          selectedMetal={selectedMetal}
          onMetalSelect={setSelectedMetal}
          priceDisplayMode={priceDisplayMode}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <GoldCard gradient>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-xl font-semibold capitalize transition-colors duration-300 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {selectedMetal} Price Chart
                  </h2>
                  <p className={`text-sm transition-colors duration-300 ${
                    isDark ? 'text-gray-400' : 'text-slate-500'
                  }`}>
                    Real-time price movements
                  </p>
                </div>
                
                {/* Timeframe Selector */}
                <div className="flex items-center space-x-2">
                  {timeframes.map((timeframe) => (
                    <GoldButton
                      key={timeframe}
                      variant={selectedTimeframe === timeframe ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className="px-3 py-1"
                    >
                      {timeframe}
                    </GoldButton>
                  ))}
                </div>
              </div>
              
              <PriceChart
                metal={selectedMetal}
                timeframe={selectedTimeframe}
              />
            </GoldCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Assistant */}
            <AIAssistant
              selectedMetal={selectedMetal}
              currentPrices={prices}
              timeframe={selectedTimeframe}
            />

            {/* Historical Calendar */}
            <GoldCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Historical Data
                </h3>
                <GoldButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  {showCalendar ? 'Hide' : 'Show'} Calendar
                </GoldButton>
              </div>
              
              {showCalendar && (
                <HistoricalCalendar
                  selectedMetal={selectedMetal}
                  onDateSelect={(date) => console.log('Selected date:', date)}
                />
              )}
            </GoldCard>

            {/* Market Insights */}
            <MarketInsights />
          </div>
        </div>
      </div>

      {/* Gold Dust Animation Overlay */}
      {isDark && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-amber-400/30 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: -10,
                opacity: 0
              }}
              animate={{
                y: window.innerHeight + 10,
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "linear"
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;