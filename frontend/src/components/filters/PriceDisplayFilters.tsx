import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import GoldCard from '../common/GoldCard';
import GoldButton from '../common/GoldButton';

interface PriceDisplayFiltersProps {
  priceDisplayMode: 'per_ounce' | 'gram_24k' | 'gram_22k' | 'gram_18k';
  onModeChange: (mode: 'per_ounce' | 'gram_24k' | 'gram_22k' | 'gram_18k') => void;
  onClose: () => void;
}

const PriceDisplayFilters: React.FC<PriceDisplayFiltersProps> = ({
  priceDisplayMode,
  onModeChange,
  onClose
}) => {
  const { isDark } = useTheme();

  const filterOptions = [
    { 
      value: 'per_ounce', 
      label: 'Per Ounce', 
      desc: 'Traditional trading unit',
      icon: '🏆',
      popular: true
    },
    { 
      value: 'gram_24k', 
      label: '24K Gold/Gram', 
      desc: 'Pure gold per gram',
      icon: '✨',
      popular: false
    },
    { 
      value: 'gram_22k', 
      label: '22K Gold/Gram', 
      desc: 'Jewelry grade per gram',
      icon: '💍',
      popular: true
    },
    { 
      value: 'gram_18k', 
      label: '18K Gold/Gram', 
      desc: 'Lower purity per gram',
      icon: '🔗',
      popular: false
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <GoldCard gradient>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-10 h-10 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-full flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Settings className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Price Display Options
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Choose how you want to view precious metal prices
                </p>
              </div>
            </div>
            
            <GoldButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="h-4 w-4" />
            </GoldButton>
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filterOptions.map(({ value, label, desc, icon, popular }) => (
              <motion.div
                key={value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={() => onModeChange(value as any)}
                  className={`
                    relative w-full p-4 rounded-xl border-2 transition-all duration-300 text-left
                    ${priceDisplayMode === value
                      ? isDark
                        ? 'border-amber-500 bg-gradient-to-br from-amber-900/30 to-yellow-900/20'
                        : 'border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50'
                      : isDark
                        ? 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-650'
                        : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
                    }
                  `}
                >
                  {/* Popular Badge */}
                  {popular && (
                    <motion.div
                      className={`
                        absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-medium
                        ${isDark 
                          ? 'bg-amber-600 text-white' 
                          : 'bg-amber-500 text-white'
                        }
                      `}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Popular
                    </motion.div>
                  )}

                  <div className="flex items-start space-x-3">
                    <motion.span 
                      className="text-2xl"
                      whileHover={{ scale: 1.2 }}
                      transition={{ duration: 0.2 }}
                    >
                      {icon}
                    </motion.span>
                    <div className="flex-1">
                      <div className={`font-medium text-sm mb-1 transition-colors duration-300 ${
                        priceDisplayMode === value
                          ? isDark ? 'text-amber-300' : 'text-amber-700'
                          : isDark ? 'text-white' : 'text-slate-900'
                      }`}>
                        {label}
                      </div>
                      <div className={`text-xs transition-colors duration-300 ${
                        priceDisplayMode === value
                          ? isDark ? 'text-amber-400' : 'text-amber-600'
                          : isDark ? 'text-gray-400' : 'text-slate-500'
                      }`}>
                        {desc}
                      </div>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {priceDisplayMode === value && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-b-xl"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex items-center justify-between">
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Current selection: <span className="font-medium">
                {filterOptions.find(opt => opt.value === priceDisplayMode)?.label}
              </span>
            </div>
            
            <div className="flex space-x-2">
              <GoldButton
                variant="ghost"
                size="sm"
                onClick={() => onModeChange('per_ounce')}
                disabled={priceDisplayMode === 'per_ounce'}
              >
                Reset to Default
              </GoldButton>
              
              <GoldButton
                variant="secondary"
                size="sm"
                onClick={onClose}
              >
                Apply & Close
              </GoldButton>
            </div>
          </div>
        </GoldCard>
      </motion.div>
    </AnimatePresence>
  );
};

export default PriceDisplayFilters;