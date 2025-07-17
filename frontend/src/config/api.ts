/**
 * API Configuration - Single source of truth for all API endpoints
 */

// Environment-based API configuration
const isDevelopment = import.meta.env.DEV;
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '3000';
const FRONTEND_PORT = window.location.port;

// Base URLs
export const API_BASE_URL = isDevelopment 
  ? `http://localhost:${BACKEND_PORT}`
  : window.location.origin;

export const WS_BASE_URL = isDevelopment
  ? `ws://localhost:3001`
  : `ws://${window.location.hostname}:3001`;

// API Endpoints
export const API_ENDPOINTS = {
  // Metal Prices
  METALS: {
    LIVE: '/api/metals/live',
    LIVE_METAL: (metal: string) => `/api/metals/${metal}/live`,
    HISTORICAL: (metal: string, date: string) => `/api/metals/${metal}/historical/${date}`,
    CHART: (metal: string, period: string) => `/api/metals/${metal}/chart/${period}`,
    HISTORICAL_CHART: (metal: string) => `/api/metals/historical-chart/${metal}`,
    CONVERT: '/api/metals/convert',
    TIMEFRAME: '/api/metals/timeframe',
    CHANGE: '/api/metals/change',
    CARAT: '/api/metals/carat',
    SYMBOLS: '/api/metals/symbols'
  },
  
  // AI Endpoints
  AI: {
    ASSISTANT: '/api/metals/ai/assistant',
    MARKET_INSIGHTS: '/api/metals/ai/market-insights',
    CHAT: '/api/metals/ai/chat',
    INSIGHTS: '/api/metals/ai/insights'
  },
  
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile'
  },
  
  // Admin
  ADMIN: {
    PROVIDER_SWITCH: '/api/metals/admin/provider/switch',
    PROVIDER_HEALTH: '/api/metals/admin/provider/health',
    PROVIDER_STATUS: '/api/metals/admin/provider/status',
    STATS: '/api/metals/admin/stats',
    CLEANUP: '/api/metals/admin/cleanup',
    SYNC_STATUS: '/api/metals/admin/sync/status',
    SYNC_TRIGGER: '/api/metals/admin/sync/trigger',
    SYNC_HEALTH: '/api/metals/admin/sync/health',
    BULK_SYNC_TRIGGER: '/api/metals/admin/bulk-sync/trigger',
    BULK_SYNC_STATUS: '/api/metals/admin/bulk-sync/status',
    AI_HEALTH: '/api/metals/admin/ai/health'
  }
};

// Helper function to build full URL
export const buildApiUrl = (endpoint: string, params?: Record<string, string | number>): string => {
  let url = `${API_BASE_URL}${endpoint}`;
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    url += `?${searchParams.toString()}`;
  }
  
  return url;
};

// HTTP client with error handling
export class ApiClient {
  static async request<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
      const url = buildApiUrl(endpoint);
      console.log(`🔗 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error: ${response.status} ${response.statusText}`, errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      console.log(`✅ API Response: ${url}`, data);
      console.log(`📊 Response Structure:`, {
        hasSuccess: 'success' in data,
        hasData: 'data' in data,
        dataType: typeof data.data,
        keys: Object.keys(data)
      });
      return { success: true, data };

    } catch (error) {
      console.error(`❌ Network Error: ${endpoint}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  static async get<T = any>(endpoint: string, params?: Record<string, string | number>) {
    const url = params ? buildApiUrl(endpoint, params) : buildApiUrl(endpoint);
    return this.request<T>(url.replace(API_BASE_URL, ''));
  }

  static async post<T = any>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put<T = any>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete<T = any>(endpoint: string) {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Development logging
if (isDevelopment) {
  console.log('🚀 API Configuration:', {
    API_BASE_URL,
    WS_BASE_URL,
    BACKEND_PORT,
    FRONTEND_PORT,
    isDevelopment
  });
}