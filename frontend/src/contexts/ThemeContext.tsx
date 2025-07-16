import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  userTheme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  userTheme, 
  onThemeChange 
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Priority: userTheme (from DB) > localStorage > default
    if (userTheme) {
      return userTheme;
    }
    
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      return savedTheme || 'light';
    }
    return 'light';
  });

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Update localStorage
    localStorage.setItem('theme', newTheme);
    
    // Update database if callback is provided
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  };

  // Update theme when userTheme prop changes
  useEffect(() => {
    if (userTheme && userTheme !== theme) {
      setTheme(userTheme);
    }
  }, [userTheme]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};