import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, EyeOff } from 'lucide-react';
import EnhancedMetalCard from './EnhancedMetalCard';
import { CardSkeleton } from '../common/LoadingSkeleton';
import GoldButton from '../common/GoldButton';
import { useTheme } from '../../contexts/ThemeContext';

export interface Metal {
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

interface MetalsGridProps {
  metals: Metal[];
  loading: boolean;
  error: string | null;
  selectedMetal: string;
  onMetalSelect: (metal: string) => void;
  priceDisplayMode: 'per_ounce' | 'gram_24k' | 'gram_22k' | 'gram_18k';
}

const MetalsGrid: React.FC<MetalsGridProps> = ({
  metals,
  loading,
  error,
  selectedMetal,
  onMetalSelect,
  priceDisplayMode
}) => {
  const { isDark } = useTheme();
  const [showAllMetals, setShowAllMetals] = useState(false);
  
  // Primary metals (always shown)
  const primaryMetals = ['Gold', 'Silver'];
  
  // Secondary metals (shown only when expanded)
  const secondaryMetals = ['Platinum', 'Palladium'];
  
  const getVisibleMetals = () => {
    if (showAllMetals) {
      return metals;
    }
    return metals.filter(metal => primaryMetals.includes(metal.name));
  };
  
  const getHiddenMetalsCount = () => {
    return metals.filter(metal => secondaryMetals.includes(metal.name)).length;
  };
  
  const visibleMetals = getVisibleMetals();
  const hiddenCount = getHiddenMetalsCount();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <CardSkeleton items={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-full flex items-center justify-center py-12">
        <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="text-lg mb-2">⚠️ Unable to load market data</p>
          <p className="text-sm">{error}</p>
          <GoldButton 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </GoldButton>
        </div>
      </div>
    );
  }

  if (metals.length === 0) {
    return (
      <div className="col-span-full flex items-center justify-center py-12">
        <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="text-lg mb-2">📊 No market data available</p>
          <p className="text-sm">Please check your API configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Primary Metals Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        layout
      >
        <AnimatePresence mode="popLayout">
          {visibleMetals.map((metal, index) => (
            <motion.div
              key={metal.symbol}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ 
                delay: index * 0.1,
                duration: 0.3,
                layout: { duration: 0.4 }
              }}
            >
              <EnhancedMetalCard
                metal={metal}
                isSelected={selectedMetal === metal.name.toLowerCase()}
                onClick={() => onMetalSelect(metal.name.toLowerCase())}
                priceDisplayMode={priceDisplayMode}
                enhanced={primaryMetals.includes(metal.name)}
              />
            </motion.div>
          ))}
          
          {/* Show More/Less Button */}
          {hiddenCount > 0 && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: visibleMetals.length * 0.1 }}
            >
              <motion.div
                className={`
                  rounded-xl shadow-lg p-6 transition-all duration-300 cursor-pointer
                  border-2 border-dashed
                  ${isDark 
                    ? 'bg-gray-800/50 border-gray-600 hover:border-amber-500/50 hover:bg-gray-800' 
                    : 'bg-slate-50/50 border-slate-300 hover:border-amber-300 hover:bg-slate-50'
                  }
                `}
                onClick={() => setShowAllMetals(!showAllMetals)}
                whileHover={{ 
                  scale: 1.02,
                  borderColor: isDark ? '#f59e0b' : '#fbbf24'
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-4">
                  <motion.div
                    className={`
                      w-16 h-16 rounded-full flex items-center justify-center
                      ${isDark 
                        ? 'bg-gradient-to-r from-amber-600/20 to-yellow-600/20' 
                        : 'bg-gradient-to-r from-amber-100 to-yellow-100'
                      }
                    `}
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.3 }}
                  >
                    {showAllMetals ? (
                      <EyeOff className={`h-8 w-8 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    ) : (
                      <Plus className={`h-8 w-8 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    )}
                  </motion.div>
                  
                  <div className="text-center">
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {showAllMetals ? 'Show Less' : `Show ${hiddenCount} More`}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      {showAllMetals 
                        ? 'Hide platinum & palladium' 
                        : 'View platinum & palladium prices'
                      }
                    </p>
                  </div>
                  
                  {!showAllMetals && (
                    <motion.div 
                      className="flex space-x-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {metals
                        .filter(metal => secondaryMetals.includes(metal.name))
                        .map(metal => (
                          <div
                            key={metal.symbol}
                            className={`
                              w-3 h-3 rounded-full border-2
                              ${isDark ? 'border-gray-600' : 'border-slate-300'}
                            `}
                            style={{ backgroundColor: metal.color }}
                          />
                        ))
                      }
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Status Indicator */}
      {hiddenCount > 0 && (
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
            {showAllMetals 
              ? `Showing all ${metals.length} precious metals`
              : `Showing ${visibleMetals.length} of ${metals.length} metals • ${hiddenCount} hidden`
            }
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default MetalsGrid;