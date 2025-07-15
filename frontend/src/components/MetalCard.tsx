import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';

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
  const isPositive = metal.change > 0;
  const isNegative = metal.change < 0;
  
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const trendColor = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-slate-500';
  const bgColor = isPositive ? 'bg-green-50' : isNegative ? 'bg-red-50' : 'bg-slate-50';
  
  return (
    <motion.div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-xl',
        isSelected && 'ring-2 ring-amber-500 ring-offset-2'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
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
            <h3 className="text-lg font-semibold text-slate-900">{metal.name}</h3>
            <p className="text-sm text-slate-500">{metal.symbol}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-slate-500">Price</div>
          <div className="text-sm font-medium text-slate-700">₹/oz</div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="text-2xl font-bold text-slate-900">
          ₹{metal.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        
        <div className={clsx('flex items-center space-x-2 px-3 py-1 rounded-lg', bgColor)}>
          <TrendIcon className={clsx('h-4 w-4', trendColor)} />
          <span className={clsx('text-sm font-medium', trendColor)}>
            {isPositive ? '+' : ''}₹{Math.abs(metal.change).toFixed(2)}
          </span>
          <span className={clsx('text-sm font-medium', trendColor)}>
            ({isPositive ? '+' : ''}{metal.changePercent.toFixed(2)}%)
          </span>
        </div>
        
        <div className="flex justify-between text-sm text-slate-500">
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
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>24h Range</span>
          <span>{((metal.price - metal.low) / (metal.high - metal.low) * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full relative"
          >
            <div 
              className="absolute top-0 w-2 h-2 bg-slate-800 rounded-full transform -translate-x-1"
              style={{ 
                left: `${((metal.price - metal.low) / (metal.high - metal.low) * 100)}%` 
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MetalCard;