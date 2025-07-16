import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import { useTheme } from '../contexts/ThemeContext';

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

interface MetalCardProps {
  metal: Metal;
  isSelected: boolean;
  onClick: () => void;
}

const MetalCard: React.FC<MetalCardProps> = ({ metal, isSelected, onClick }) => {
  const { isDark } = useTheme();
  const isPositive = metal.change > 0;
  const isNegative = metal.change < 0;
  
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const trendColor = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : (isDark ? 'text-gray-400' : 'text-slate-500');
  const bgColor = isPositive 
    ? (isDark ? 'bg-green-900/20' : 'bg-green-50') 
    : isNegative 
    ? (isDark ? 'bg-red-900/20' : 'bg-red-50') 
    : (isDark ? 'bg-gray-800/50' : 'bg-slate-50');
  
  return (
    <motion.div
      onClick={onClick}
      className={clsx(
        'rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-xl',
        isDark 
          ? 'bg-gray-800 shadow-gray-900/20 hover:shadow-gray-900/30' 
          : 'bg-white shadow-gray-200/50 hover:shadow-gray-300/70',
        isSelected && (isDark 
          ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-gray-900' 
          : 'ring-2 ring-amber-500 ring-offset-2')
      )}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: metal.color + '20' }}
          >
            <span className="text-lg font-bold" style={{ color: metal.color }}>
              {metal.symbol.slice(1)}
            </span>
          </div>
          <div>
            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>{metal.name}</h3>
            <p className={`text-sm transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-slate-500'
            }`}>{metal.symbol}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-xs transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-slate-500'
          }`}>Price</div>
          <div className={`text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-gray-300' : 'text-slate-700'
          }`}>₹/oz</div>
        </div>
      </div>
      
      <div className="space-y-3">
        <motion.div 
          className={`text-2xl font-bold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          ₹{metal.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </motion.div>
        
        <div className={clsx('flex items-center space-x-2 px-3 py-1 rounded-lg', bgColor)}>
          <TrendIcon className={clsx('h-4 w-4', trendColor)} />
          <span className={clsx('text-sm font-medium', trendColor)}>
            {isPositive ? '+' : ''}₹{Math.abs(metal.change).toFixed(2)}
          </span>
          <span className={clsx('text-sm font-medium', trendColor)}>
            ({isPositive ? '+' : ''}{metal.changePercent.toFixed(2)}%)
          </span>
        </div>
        
        <div className={`flex justify-between text-sm transition-colors duration-300 ${
          isDark ? 'text-gray-400' : 'text-slate-500'
        }`}>
          <div>
            <span className="text-green-600 font-medium">H:</span> ₹{metal.high.toFixed(2)}
          </div>
          <div>
            <span className="text-red-600 font-medium">L:</span> ₹{metal.low.toFixed(2)}
          </div>
        </div>
      </div>
      
      {/* Price Movement Bar */}
      <div className="mt-4">
        <div className={`flex justify-between text-xs mb-1 transition-colors duration-300 ${
          isDark ? 'text-gray-400' : 'text-slate-500'
        }`}>
          <span>24h Range</span>
          <span>{((metal.price - metal.low) / (metal.high - metal.low) * 100).toFixed(0)}%</span>
        </div>
        <div className={`w-full rounded-full h-2 transition-colors duration-300 ${
          isDark ? 'bg-gray-700' : 'bg-slate-200'
        }`}>
          <motion.div 
            className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <motion.div 
              className={`absolute top-0 w-2 h-2 rounded-full transform -translate-x-1 ${
                isDark ? 'bg-white' : 'bg-slate-800'
              }`}
              style={{ 
                left: `${((metal.price - metal.low) / (metal.high - metal.low) * 100)}%` 
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default MetalCard;