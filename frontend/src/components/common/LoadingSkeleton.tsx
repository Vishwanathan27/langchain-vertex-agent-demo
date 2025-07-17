import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface LoadingSkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = true
}) => {
  const { isDark } = useTheme();
  
  const skeletonClasses = `
    ${width} ${height}
    ${rounded ? 'rounded' : ''}
    ${isDark ? 'bg-gray-600' : 'bg-gray-300'}
    ${className}
  `.replace(/\s+/g, ' ').trim();

  return (
    <motion.div
      className={skeletonClasses}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
};

interface CardSkeletonProps {
  items?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ items = 1 }) => {
  const { isDark } = useTheme();
  
  return (
    <>
      {Array.from({ length: items }, (_, index) => (
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
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <LoadingSkeleton width="w-12" height="h-12" rounded />
              <div className="space-y-2 flex-1">
                <LoadingSkeleton width="w-20" height="h-4" />
                <LoadingSkeleton width="w-16" height="h-3" />
              </div>
            </div>
            <div className="space-y-3">
              <LoadingSkeleton width="w-32" height="h-8" />
              <LoadingSkeleton width="w-24" height="h-6" />
              <LoadingSkeleton />
            </div>
          </div>
        </motion.div>
      ))}
    </>
  );
};

export default LoadingSkeleton;