import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Star, Crown } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Metal } from './MetalsGrid';

interface EnhancedMetalCardProps {
  metal: Metal;
  isSelected: boolean;
  onClick: () => void;
  priceDisplayMode?: 'per_ounce' | 'gram_24k' | 'gram_22k' | 'gram_18k';
  enhanced?: boolean; // For premium metals like Gold/Silver
}

const EnhancedMetalCard: React.FC<EnhancedMetalCardProps> = ({ 
  metal, 
  isSelected, 
  onClick, 
  priceDisplayMode = 'per_ounce',
  enhanced = false
}) => {
  const { isDark } = useTheme();
  const isPositive = metal.change > 0;
  const isNegative = metal.change < 0;
  const isGold = metal.name.toLowerCase() === 'gold';
  const isSilver = metal.name.toLowerCase() === 'silver';
  
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  
  // Enhanced color schemes for premium metals
  const getCardColors = () => {
    if (isSelected) {
      if (isGold) {
        return {
          bg: isDark 
            ? 'bg-gradient-to-br from-amber-900/30 via-yellow-900/20 to-amber-800/30' 
            : 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100',
          border: 'border-2 border-amber-500',
          shadow: isDark 
            ? 'shadow-amber-500/20 shadow-2xl' 
            : 'shadow-amber-200/50 shadow-2xl',
        };
      } else if (isSilver) {
        return {
          bg: isDark 
            ? 'bg-gradient-to-br from-slate-700/30 via-gray-700/20 to-slate-600/30' 
            : 'bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100',
          border: 'border-2 border-slate-400',
          shadow: isDark 
            ? 'shadow-slate-400/20 shadow-2xl' 
            : 'shadow-slate-200/50 shadow-2xl',
        };
      } else {
        return {
          bg: isDark 
            ? 'bg-gradient-to-br from-blue-900/30 via-indigo-900/20 to-blue-800/30' 
            : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100',
          border: 'border-2 border-blue-500',
          shadow: isDark 
            ? 'shadow-blue-500/20 shadow-2xl' 
            : 'shadow-blue-200/50 shadow-2xl',
        };
      }
    }

    // Default state
    return {
      bg: isDark 
        ? 'bg-gray-800' 
        : 'bg-white',
      border: 'border border-transparent',
      shadow: isDark 
        ? 'shadow-gray-900/20' 
        : 'shadow-gray-200/50',
    };
  };

  const colors = getCardColors();
  
  const getTrendColor = () => {
    if (isPositive) return 'text-green-500';
    if (isNegative) return 'text-red-500';
    return isDark ? 'text-gray-400' : 'text-slate-500';
  };

  const getDisplayPrice = () => {
    switch (priceDisplayMode) {
      case 'gram_24k':
        return metal.price_gram_24k || metal.price;
      case 'gram_22k':
        return metal.price_gram_22k || metal.price;
      case 'gram_18k':
        return metal.price_gram_18k || metal.price;
      default:
        return metal.per_ounce_price || metal.price;
    }
  };

  const getPriceLabel = () => {
    switch (priceDisplayMode) {
      case 'gram_24k':
        return '24K/gram';
      case 'gram_22k':
        return '22K/gram';
      case 'gram_18k':
        return '18K/gram';
      default:
        return 'per ounce';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <motion.div
      onClick={onClick}
      className={`
        rounded-xl p-6 cursor-pointer transition-all duration-300 relative overflow-hidden
        ${colors.bg} ${colors.border} ${colors.shadow}
        hover:shadow-2xl transform-gpu
      `}
      whileHover={{ 
        scale: 1.02,
        y: -4,
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Premium Badge */}
      {enhanced && (
        <motion.div
          className={`
            absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center
            ${isGold 
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500' 
              : 'bg-gradient-to-r from-slate-400 to-gray-500'
            }
          `}
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6 }}
        >
          {isGold ? (
            <Crown className="h-3 w-3 text-white" />
          ) : (
            <Star className="h-3 w-3 text-white" />
          )}
        </motion.div>
      )}

      {/* Animated Background Pattern for Gold */}
      {isGold && isSelected && (
        <motion.div
          className="absolute inset-0 opacity-10"
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-full h-full bg-gradient-conic from-amber-400 via-yellow-500 to-amber-400" />
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center space-x-3 mb-4 relative z-10">
        <motion.div
          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg"
          style={{ backgroundColor: metal.color }}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          {metal.symbol.slice(0, 2)}
        </motion.div>
        
        <div className="flex-1">
          <h3 className={`text-lg font-semibold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {metal.name}
          </h3>
          <p className={`text-sm transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-slate-500'
          }`}>
            {metal.symbol}
          </p>
        </div>
      </div>

      {/* Price Display */}
      <div className="space-y-3 relative z-10">
        <div>
          <motion.p 
            className={`text-2xl font-bold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
            key={getDisplayPrice()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {formatPrice(getDisplayPrice())}
          </motion.p>
          <p className={`text-xs transition-colors duration-300 ${
            isDark ? 'text-gray-500' : 'text-slate-400'
          }`}>
            {getPriceLabel()}
          </p>
        </div>

        {/* Change Indicator */}
        <motion.div 
          className={`
            flex items-center space-x-2 px-3 py-1 rounded-full
            ${isPositive 
              ? isDark ? 'bg-green-900/30' : 'bg-green-100'
              : isNegative 
              ? isDark ? 'bg-red-900/30' : 'bg-red-100'
              : isDark ? 'bg-gray-700/50' : 'bg-slate-100'
            }
          `}
          whileHover={{ scale: 1.05 }}
        >
          <TrendIcon className={`h-4 w-4 ${getTrendColor()}`} />
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {metal.change > 0 ? '+' : ''}{metal.change.toFixed(2)} ({metal.changePercent.toFixed(2)}%)
          </span>
        </motion.div>

        {/* High/Low Range */}
        <div className={`flex justify-between text-xs transition-colors duration-300 ${
          isDark ? 'text-gray-400' : 'text-slate-500'
        }`}>
          <span>H: {formatPrice(metal.high)}</span>
          <span>L: {formatPrice(metal.low)}</span>
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          className={`
            absolute bottom-0 left-0 right-0 h-1 rounded-b-xl
            ${isGold 
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500' 
              : isSilver 
              ? 'bg-gradient-to-r from-slate-400 to-gray-500'
              : 'bg-gradient-to-r from-blue-400 to-indigo-500'
            }
          `}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Hover Glow Effect */}
      <motion.div
        className={`
          absolute inset-0 rounded-xl opacity-0 pointer-events-none
          ${isGold 
            ? 'bg-gradient-to-br from-amber-400/10 to-yellow-500/10' 
            : isSilver 
            ? 'bg-gradient-to-br from-slate-400/10 to-gray-500/10'
            : 'bg-gradient-to-br from-blue-400/10 to-indigo-500/10'
          }
        `}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default EnhancedMetalCard;