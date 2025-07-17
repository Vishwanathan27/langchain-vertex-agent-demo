import React from 'react';
import { motion } from 'framer-motion';
import { Search, Bell, Settings, Filter } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import UserProfile from '../UserProfile';
import GoldInput from '../common/GoldInput';
import GoldButton from '../common/GoldButton';

interface DashboardHeaderProps {
  showFilters: boolean;
  onToggleFilters: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  showFilters,
  onToggleFilters
}) => {
  const { isDark } = useTheme();

  return (
    <motion.header 
      className={`shadow-sm border-b transition-all duration-300 ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-slate-200'
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <motion.div 
                className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center"
                whileHover={{ 
                  scale: 1.1,
                  background: 'linear-gradient(45deg, #fbbf24 0%, #f59e0b 100%)'
                }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-white font-bold text-sm">S</span>
              </motion.div>
              <h1 className={`text-xl font-bold transition-colors duration-300 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                SwarnaAI
              </h1>
            </div>
            
            {/* Live Market Indicator */}
            <div className={`hidden md:flex items-center space-x-1 text-xs transition-colors duration-300 ${
              isDark ? 'text-gray-400' : 'text-slate-500'
            }`}>
              <motion.div 
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.7, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <span>Live Market Data</span>
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Search Input */}
            <div className="hidden md:block">
              <GoldInput
                type="text"
                placeholder="Search metals, news..."
                variant="search"
                icon={<Search className="h-4 w-4" />}
                className="w-64"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <GoldButton
                variant="ghost"
                size="sm"
                className={`p-2 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Bell className="h-5 w-5" />
              </GoldButton>
              
              <GoldButton
                variant="ghost"
                size="sm"
                onClick={onToggleFilters}
                className={`p-2 ${
                  showFilters 
                    ? 'text-amber-500 bg-amber-100 dark:bg-amber-900/20' 
                    : isDark ? 'text-gray-400 hover:text-gray-300' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Filter className="h-5 w-5" />
              </GoldButton>
              
              <GoldButton
                variant="ghost"
                size="sm"
                className={`p-2 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Settings className="h-5 w-5" />
              </GoldButton>
              
              <UserProfile />
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default DashboardHeader;