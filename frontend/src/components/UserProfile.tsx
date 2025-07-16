import React, { useState } from 'react';
import { User, LogOut, Settings, Activity, ChevronDown, ChevronUp, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const UserProfile: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const handleLogout = async () => {
    await logout();
  };

  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/auth/activity', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setActivities(data.activities.slice(0, 5)); // Show last 5 activities
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    }
  };

  const toggleActivity = () => {
    if (!showActivity) {
      fetchActivity();
    }
    setShowActivity(!showActivity);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {user.role}
          </p>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user.role} • {user.permissions.length} permissions
                </p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Switch to {isDark ? 'Light' : 'Dark'} Mode
              </span>
            </button>

            <button
              onClick={toggleActivity}
              className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Recent Activity
              </span>
              {showActivity ? (
                <ChevronUp className="w-4 h-4 text-gray-500 ml-auto" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />
              )}
            </button>

            {showActivity && (
              <div className="ml-8 mt-2 space-y-2">
                {activities.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No recent activity
                  </p>
                ) : (
                  activities.map((activity, index) => (
                    <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {activity.action.replace('_', ' ')}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {activity.details}
                      </p>
                      <p className="text-gray-400 dark:text-gray-500">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 p-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;