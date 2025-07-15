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

  const generateMockPriceData = useCallback((): RealTimePricesData => {
    const basePrice = (metal: string) => {
      switch (metal) {
        case 'gold': return 5400;
        case 'silver': return 82;
        case 'platinum': return 2890;
        case 'palladium': return 1890;
        default: return 1000;
      }
    };

    const createPriceData = (metal: string): PriceData => {
      const base = basePrice(metal);
      const variation = (Math.random() - 0.5) * (base * 0.03); // 3% variation
      const price = base + variation;
      const previousPrice = base + (Math.random() - 0.5) * (base * 0.02);
      const change = price - previousPrice;
      const changePercent = (change / previousPrice) * 100;
      
      return {
        price: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        high: Math.round((price + Math.random() * base * 0.02) * 100) / 100,
        low: Math.round((price - Math.random() * base * 0.02) * 100) / 100,
        timestamp: new Date()
      };
    };

    return {
      gold: createPriceData('gold'),
      silver: createPriceData('silver'),
      platinum: createPriceData('platinum'),
      palladium: createPriceData('palladium')
    };
  }, []);

  const fetchPrices = useCallback(async () => {
    try {
      setError(null);
      
      // Try to fetch from real API first
      try {
        const response = await fetch(`${API_BASE_URL}/live`);
        const result = await response.json();
        
        if (result.success && result.data) {
          const formattedData: RealTimePricesData = {
            gold: {
              price: result.data.gold?.price_ounce || result.data.gold?.price || 0,
              change: result.data.gold?.ch || 0,
              changePercent: result.data.gold?.chp || 0,
              high: result.data.gold?.high || result.data.gold?.price || 0,
              low: result.data.gold?.low || result.data.gold?.price || 0,
              timestamp: new Date()
            },
            silver: {
              price: result.data.silver?.price_ounce || result.data.silver?.price || 0,
              change: result.data.silver?.ch || 0,
              changePercent: result.data.silver?.chp || 0,
              high: result.data.silver?.high || result.data.silver?.price || 0,
              low: result.data.silver?.low || result.data.silver?.price || 0,
              timestamp: new Date()
            },
            platinum: {
              price: result.data.platinum?.price_ounce || result.data.platinum?.price || 0,
              change: result.data.platinum?.ch || 0,
              changePercent: result.data.platinum?.chp || 0,
              high: result.data.platinum?.high || result.data.platinum?.price || 0,
              low: result.data.platinum?.low || result.data.platinum?.price || 0,
              timestamp: new Date()
            },
            palladium: {
              price: result.data.palladium?.price_ounce || result.data.palladium?.price || 0,
              change: result.data.palladium?.ch || 0,
              changePercent: result.data.palladium?.chp || 0,
              high: result.data.palladium?.high || result.data.palladium?.price || 0,
              low: result.data.palladium?.low || result.data.palladium?.price || 0,
              timestamp: new Date()
            }
          };
          
          setPrices(formattedData);
          setLastUpdated(new Date());
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.warn('API fetch failed, using mock data:', apiError);
      }
      
      // Fallback to mock data
      const mockData = generateMockPriceData();
      setPrices(mockData);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch price data');
      setLoading(false);
    }
  }, [generateMockPriceData]);

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