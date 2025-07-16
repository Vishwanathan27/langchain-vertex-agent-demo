import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:3000/api/metals';
const WS_URL = 'ws://localhost:3001';

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
      
      const response = await fetch(`${API_BASE_URL}/live`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }
      
      if (!result.data) {
        throw new Error('No data received from API');
      }
      
      // Only process metals that have valid data (no errors)
      const formattedData: Partial<RealTimePricesData> = {};
      
      if (result.data.gold && !result.data.gold.error && result.data.gold.price) {
        formattedData.gold = {
          price: result.data.gold.price,
          change: result.data.gold.change || 0,
          changePercent: result.data.gold.changePercent || 0,
          high: result.data.gold.high || result.data.gold.price,
          low: result.data.gold.low || result.data.gold.price,
          timestamp: new Date(),
          price_gram_24k: result.data.gold.price_gram_24k,
          price_gram_22k: result.data.gold.price_gram_22k,
          price_gram_18k: result.data.gold.price_gram_18k,
          per_ounce_price: result.data.gold.price
        };
      }
      
      if (result.data.silver && !result.data.silver.error && result.data.silver.price) {
        formattedData.silver = {
          price: result.data.silver.price,
          change: result.data.silver.change || 0,
          changePercent: result.data.silver.changePercent || 0,
          high: result.data.silver.high || result.data.silver.price,
          low: result.data.silver.low || result.data.silver.price,
          timestamp: new Date(),
          price_gram_24k: result.data.silver.price_gram_24k,
          price_gram_22k: result.data.silver.price_gram_22k,
          price_gram_18k: result.data.silver.price_gram_18k,
          per_ounce_price: result.data.silver.price
        };
      }
      
      if (result.data.platinum && !result.data.platinum.error && result.data.platinum.price) {
        formattedData.platinum = {
          price: result.data.platinum.price,
          change: result.data.platinum.change || 0,
          changePercent: result.data.platinum.changePercent || 0,
          high: result.data.platinum.high || result.data.platinum.price,
          low: result.data.platinum.low || result.data.platinum.price,
          timestamp: new Date(),
          price_gram_24k: result.data.platinum.price_gram_24k,
          price_gram_22k: result.data.platinum.price_gram_22k,
          price_gram_18k: result.data.platinum.price_gram_18k,
          per_ounce_price: result.data.platinum.price
        };
      }
      
      if (result.data.palladium && !result.data.palladium.error && result.data.palladium.price) {
        formattedData.palladium = {
          price: result.data.palladium.price,
          change: result.data.palladium.change || 0,
          changePercent: result.data.palladium.changePercent || 0,
          high: result.data.palladium.high || result.data.palladium.price,
          low: result.data.palladium.low || result.data.palladium.price,
          timestamp: new Date(),
          price_gram_24k: result.data.palladium.price_gram_24k,
          price_gram_22k: result.data.palladium.price_gram_22k,
          price_gram_18k: result.data.palladium.price_gram_18k,
          per_ounce_price: result.data.palladium.price
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

    // Set up WebSocket connection for real-time updates
    let ws: WebSocket | null = null;
    
    const connectWebSocket = () => {
      try {
        ws = new WebSocket(WS_URL);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'priceUpdate' && data.data) {
              const formattedData: RealTimePricesData = {
                gold: {
                  price: data.data.gold?.price || 0,
                  change: data.data.gold?.change || 0,
                  changePercent: data.data.gold?.changePercent || 0,
                  high: data.data.gold?.high || 0,
                  low: data.data.gold?.low || 0,
                  timestamp: new Date(data.data.gold?.timestamp || Date.now())
                },
                silver: {
                  price: data.data.silver?.price || 0,
                  change: data.data.silver?.change || 0,
                  changePercent: data.data.silver?.changePercent || 0,
                  high: data.data.silver?.high || 0,
                  low: data.data.silver?.low || 0,
                  timestamp: new Date(data.data.silver?.timestamp || Date.now())
                },
                platinum: {
                  price: data.data.platinum?.price || 0,
                  change: data.data.platinum?.change || 0,
                  changePercent: data.data.platinum?.changePercent || 0,
                  high: data.data.platinum?.high || 0,
                  low: data.data.platinum?.low || 0,
                  timestamp: new Date(data.data.platinum?.timestamp || Date.now())
                },
                palladium: {
                  price: data.data.palladium?.price || 0,
                  change: data.data.palladium?.change || 0,
                  changePercent: data.data.palladium?.changePercent || 0,
                  high: data.data.palladium?.high || 0,
                  low: data.data.palladium?.low || 0,
                  timestamp: new Date(data.data.palladium?.timestamp || Date.now())
                }
              };
              
              setPrices(formattedData);
              setLastUpdated(new Date());
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          // Attempt to reconnect after 5 seconds
          setTimeout(connectWebSocket, 5000);
        };
      } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        // Fallback to interval-based updates
        const interval = setInterval(() => {
          fetchPrices();
        }, 60000); // Update every minute
        
        return () => {
          clearInterval(interval);
        };
      }
    };
    
    // Try WebSocket connection, fallback to polling
    connectWebSocket();
    
    // Fallback interval in case WebSocket fails
    const fallbackInterval = setInterval(() => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        fetchPrices();
      }
    }, 120000); // Update every 2 minutes as fallback

    return () => {
      if (ws) {
        ws.close();
      }
      clearInterval(fallbackInterval);
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