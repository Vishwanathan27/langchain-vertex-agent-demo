import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface PriceChartProps {
  metal: string;
  timeframe: string;
}

interface ChartData {
  timestamp: string;
  price: number;
  volume: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ metal, timeframe }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartType, setChartType] = useState<'line' | 'area'>('area');
  const [loading, setLoading] = useState(false);
  const { isDark } = useTheme();

  // Generate sample data (replace with real API call)
  const generateSampleData = () => {
    const data: ChartData[] = [];
    const basePrice = metal === 'gold' ? 5400 : metal === 'silver' ? 82 : metal === 'platinum' ? 2890 : 1890;
    const points = timeframe === '1H' ? 60 : timeframe === '4H' ? 240 : timeframe === '1D' ? 24 : 30;
    
    for (let i = 0; i < points; i++) {
      const variation = (Math.random() - 0.5) * (basePrice * 0.02);
      const price = basePrice + variation + (Math.sin(i / 10) * basePrice * 0.01);
      
      data.push({
        timestamp: timeframe === '1H' ? `${i}:00` : timeframe === '1D' ? `${i}:00` : `Day ${i + 1}`,
        price: Math.round(price * 100) / 100,
        volume: Math.round(Math.random() * 1000000)
      });
    }
    
    return data;
  };

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setChartData(generateSampleData());
      setLoading(false);
    }, 500);
  }, [metal, timeframe]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
          <p className={`text-sm font-medium transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>{label}</p>
          <p className="text-sm text-slate-600">
            Price: <span className={`font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>₹{data.price.toLocaleString()}</span>
          </p>
          <p className="text-sm text-slate-600">
            Volume: <span className={`font-semibold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>{data.volume.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
  const previousPrice = chartData.length > 1 ? chartData[chartData.length - 2].price : currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice > 0 ? ((priceChange / previousPrice) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded-lg transition-colors ${
                chartType === 'line' 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Activity className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-2 rounded-lg transition-colors ${
                chartType === 'area' 
                  ? 'bg-amber-100 text-amber-700' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className={`text-2xl font-bold transition-colors duration-300 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center space-x-1 text-sm ${
              priceChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>
                {priceChange >= 0 ? '+' : ''}₹{Math.abs(priceChange).toFixed(2)} 
                ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#f59e0b' }}
                />
              </LineChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
        <div className="text-center">
          <div className="text-xs text-slate-500">High</div>
          <div className="text-sm font-semibold text-green-600">
            ₹{chartData.length > 0 ? Math.max(...chartData.map(d => d.price)).toFixed(2) : '0.00'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500">Low</div>
          <div className="text-sm font-semibold text-red-600">
            ₹{chartData.length > 0 ? Math.min(...chartData.map(d => d.price)).toFixed(2) : '0.00'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500">Volume</div>
          <div className={`text-sm font-semibold transition-colors duration-300 ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {chartData.length > 0 ? chartData[chartData.length - 1].volume.toLocaleString() : '0'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500">Change</div>
          <div className={`text-sm font-semibold ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;