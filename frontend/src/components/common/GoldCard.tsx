import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface GoldCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

const GoldCard: React.FC<GoldCardProps> = ({
  children,
  className = '',
  gradient = false,
  interactive = false,
  onClick
}) => {
  const { isDark } = useTheme();
  
  const baseClasses = `
    rounded-xl shadow-lg transition-all duration-300 p-6
    ${isDark 
      ? 'bg-gray-800 shadow-gray-900/20' 
      : 'bg-white shadow-gray-200/50'
    }
  `;
  
  const gradientClasses = gradient ? `
    ${isDark
      ? 'bg-gradient-to-br from-gray-800 via-amber-900/5 to-gray-800'
      : 'bg-gradient-to-br from-white via-amber-50/50 to-white'
    }
  ` : '';
  
  const interactiveClasses = interactive ? `
    cursor-pointer transform-gpu
    ${isDark
      ? 'hover:bg-gray-750 hover:shadow-amber-500/10'
      : 'hover:bg-amber-50/30 hover:shadow-amber-200/30'
    }
    hover:shadow-xl hover:-translate-y-1
  ` : '';
  
  const combinedClasses = `
    ${baseClasses}
    ${gradientClasses}
    ${interactiveClasses}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  const cardContent = (
    <div className={combinedClasses}>
      {children}
    </div>
  );

  if (interactive) {
    return (
      <motion.div
        onClick={onClick}
        whileHover={{ 
          scale: 1.02,
          y: -4,
          boxShadow: isDark 
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.05)'
        }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

export default GoldCard;