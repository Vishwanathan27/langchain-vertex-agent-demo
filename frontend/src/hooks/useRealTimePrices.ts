import { useState, useEffect, useCallback } from 'react';
import { ApiClient, API_ENDPOINTS } from '../config/api';

interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  timestamp: Date;
  price_gram_24k?: number;
  price_gram_22k?: number;
  price_gram_18k?: number;
  per_ounce_price?: number;
}

interface RealTimePricesData {
  gold: PriceData;
  silver: PriceData;
  platinum: PriceData;
  palladium: PriceData;
}

export const useRealTimePrices = () => {
  const [prices, setPrices] = useState<RealTimePricesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);


  const fetchPrices = useCallback(async () => {
    try {
      setError(null);
      
      const result = await ApiClient.get(API_ENDPOINTS.METALS.LIVE);
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }
      
      if (!result.data?.data) {
        throw new Error('No data received from API');
      }
      
      // Only process metals that have valid data (no errors)
      const formattedData: Partial<RealTimePricesData> = {};
      const apiData = result.data.data;
      
      if (apiData.gold && apiData.gold.price) {
        formattedData.gold = {
          price: apiData.gold.price,
          change: apiData.gold.change ?? 0,
          changePercent: apiData.gold.changePercent ?? 0,
          high: apiData.gold.high ?? apiData.gold.price,
          low: apiData.gold.low ?? apiData.gold.price,
          timestamp: new Date(),
          price_gram_24k: apiData.gold.price_gram_24k,
          price_gram_22k: apiData.gold.price_gram_22k,
          price_gram_18k: apiData.gold.price_gram_18k,
          per_ounce_price: apiData.gold.price
        };
      }
      
      if (apiData.silver && apiData.silver.price) {
        formattedData.silver = {
          price: apiData.silver.price,
          change: apiData.silver.change ?? 0,
          changePercent: apiData.silver.changePercent ?? 0,
          high: apiData.silver.high ?? apiData.silver.price,
          low: apiData.silver.low ?? apiData.silver.price,
          timestamp: new Date(),
          price_gram_24k: apiData.silver.price_gram_24k,
          price_gram_22k: apiData.silver.price_gram_22k,
          price_gram_18k: apiData.silver.price_gram_18k,
          per_ounce_price: apiData.silver.price
        };
      }
      
      if (apiData.platinum && apiData.platinum.price) {
        formattedData.platinum = {
          price: apiData.platinum.price,
          change: apiData.platinum.change ?? 0,
          changePercent: apiData.platinum.changePercent ?? 0,
          high: apiData.platinum.high ?? apiData.platinum.price,
          low: apiData.platinum.low ?? apiData.platinum.price,
          timestamp: new Date(),
          price_gram_24k: apiData.platinum.price_gram_24k,
          price_gram_22k: apiData.platinum.price_gram_22k,
          price_gram_18k: apiData.platinum.price_gram_18k,
          per_ounce_price: apiData.platinum.price
        };
      }
      
      if (apiData.palladium && apiData.palladium.price) {
        formattedData.palladium = {
          price: apiData.palladium.price,
          change: apiData.palladium.change ?? 0,
          changePercent: apiData.palladium.changePercent ?? 0,
          high: apiData.palladium.high ?? apiData.palladium.price,
          low: apiData.palladium.low ?? apiData.palladium.price,
          timestamp: new Date(),
          price_gram_24k: apiData.palladium.price_gram_24k,
          price_gram_22k: apiData.palladium.price_gram_22k,
          price_gram_18k: apiData.palladium.price_gram_18k,
          per_ounce_price: apiData.palladium.price
        };
      }
      
      // Only set prices if we have at least some valid data
      if (Object.keys(formattedData).length > 0) {
        setPrices(formattedData as RealTimePricesData);
        setLastUpdated(new Date());
      } else {
        throw new Error('No valid price data available for any metals');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch price data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch price data');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchPrices();

    // Disable WebSocket for now since server is not running
    // Set up periodic refresh instead
    const refreshInterval = setInterval(() => {
      fetchPrices();
    }, 300000); // Update every 5 minutes

    return () => {
      clearInterval(refreshInterval);
    };
  }, [fetchPrices]);

  const refreshPrices = useCallback(() => {
    setLoading(true);
    fetchPrices();
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    lastUpdated,
    refreshPrices
  };
};

// Hook for fetching historical price data
export const useHistoricalPrices = (metal: string, startDate: Date, endDate: Date) => {
  const [data, setData] = useState<Array<{ date: string; price: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setLoading(true);
      setError(null);

      try {
        // In a real implementation, this would be an API call
        // const response = await fetch(`/api/metals/${metal}/historical?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
        // const data = await response.json();

        // Generate mock historical data
        const mockData = [];
        const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const basePrice = metal === 'gold' ? 5400 : metal === 'silver' ? 82 : metal === 'platinum' ? 2890 : 1890;

        for (let i = 0; i <= dayDiff; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          
          const variation = (Math.random() - 0.5) * (basePrice * 0.05);
          const price = basePrice + variation + (Math.sin(i / 7) * basePrice * 0.02);
          
          mockData.push({
            date: date.toISOString().split('T')[0],
            price: Math.round(price * 100) / 100
          });
        }

        setData(mockData);
      } catch (err) {
        setError('Failed to fetch historical data');
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [metal, startDate, endDate]);

  return { data, loading, error };
};

// Hook for price alerts
export const usePriceAlerts = () => {
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    metal: string;
    type: 'above' | 'below';
    targetPrice: number;
    currentPrice: number;
    isActive: boolean;
    createdAt: Date;
  }>>([]);

  const addAlert = useCallback((metal: string, type: 'above' | 'below', targetPrice: number, currentPrice: number) => {
    const newAlert = {
      id: Date.now().toString(),
      metal,
      type,
      targetPrice,
      currentPrice,
      isActive: true,
      createdAt: new Date()
    };

    setAlerts(prev => [...prev, newAlert]);
    return newAlert.id;
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const toggleAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    ));
  }, []);

  return {
    alerts,
    addAlert,
    removeAlert,
    toggleAlert
  };
};