import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface GoldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'search';
}

const GoldInput = forwardRef<HTMLInputElement, GoldInputProps>(({
  label,
  error,
  icon,
  variant = 'default',
  className = '',
  ...props
}, ref) => {
  const { isDark } = useTheme();
  
  const inputClasses = `
    w-full px-4 py-2 border rounded-lg transition-all duration-300
    focus:ring-2 focus:ring-amber-500 focus:border-transparent
    ${icon ? 'pl-10' : ''}
    ${isDark 
      ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
      : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
    }
    ${error 
      ? 'border-red-500 focus:ring-red-500' 
      : ''
    }
    ${variant === 'search' 
      ? isDark 
        ? 'bg-gray-700/50 border-gray-600/50' 
        : 'bg-slate-50 border-slate-200'
      : ''
    }
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${
          isDark ? 'text-gray-300' : 'text-slate-700'
        }`}>
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
            isDark ? 'text-gray-400' : 'text-slate-400'
          }`}>
            {icon}
          </div>
        )}
        
        <motion.input
          ref={ref}
          className={inputClasses}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          {...props}
        />
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
});

GoldInput.displayName = 'GoldInput';

export default GoldInput;