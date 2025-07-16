import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'http://localhost:3000';

interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: string[];
  preferences: {
    theme: 'light' | 'dark';
    currency: string;
    notifications: boolean;
  };
}

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Set up axios defaults
  axios.defaults.baseURL = API_BASE_URL;
  axios.defaults.withCredentials = true;

  // Add request interceptor to include token
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor to handle token expiration
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
      return Promise.reject(error);
    }
  );

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.success) {
        const { user: userData, token } = response.data;
        
        // Store token
        localStorage.setItem('token', token);
        
        // Set user data
        setUser({
          id: userData.id,
          email: userData.email,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          permissions: userData.permissions,
          preferences: userData.preferences || { theme: 'light', currency: 'INR', notifications: true }
        });
        
        // Log activity
        await logActivity('login', 'User logged in successfully');
        
        return { success: true };
      }
      
      return { success: false, error: response.data.error };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please try again.' 
      };
    }
  };

  const register = async (data: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await axios.post('/api/auth/register', data);
      
      if (response.data.success) {
        return { success: true };
      }
      
      return { success: false, error: response.data.error };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      // Clear cookies
      Cookies.remove('sessionToken');
    }
  };

  const updatePreferences = async (preferences: Partial<User['preferences']>): Promise<boolean> => {
    try {
      const response = await axios.put('/api/auth/preferences', preferences);
      
      if (response.data.success && user) {
        setUser({
          ...user,
          preferences: { ...user.preferences, ...preferences }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update preferences error:', error);
      return false;
    }
  };

  const logActivity = async (action: string, details: string): Promise<void> => {
    try {
      await axios.post('/api/auth/activity', {
        action,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Activity logging error:', error);
    }
  };

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await axios.get('/api/auth/me');
      
      if (response.data.success) {
        const userData = response.data.user;
        setUser({
          id: userData.id,
          email: userData.email,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          permissions: userData.permissions,
          preferences: userData.preferences || { theme: 'light', currency: 'INR', notifications: true }
        });
      }
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      updatePreferences
    }}>
      {children}
    </AuthContext.Provider>
  );
};