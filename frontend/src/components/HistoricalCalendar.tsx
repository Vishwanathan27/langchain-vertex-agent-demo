import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { motion } from 'framer-motion';
import { format, startOfDay, isToday, isSameDay } from 'date-fns';
import { TrendingUp, TrendingDown, Calendar as CalendarIcon } from 'lucide-react';
import 'react-calendar/dist/Calendar.css';

interface HistoricalCalendarProps {
  selectedMetal: string;
  onDateSelect: (date: Date) => void;
}

interface PriceData {
  date: string;
  price: number;
  change: number;
  changePercent: number;
}

const HistoricalCalendar: React.FC<HistoricalCalendarProps> = ({ selectedMetal, onDateSelect }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [historicalData, setHistoricalData] = useState<PriceData[]>([]);
  const [selectedDateData, setSelectedDateData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate sample historical data
  const generateHistoricalData = () => {
    const data: PriceData[] = [];
    const basePrice = selectedMetal === 'gold' ? 5400 : selectedMetal === 'silver' ? 82 : selectedMetal === 'platinum' ? 2890 : 1890;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      const variation = (Math.random() - 0.5) * (basePrice * 0.05);
      const price = basePrice + variation + (Math.sin(i / 5) * basePrice * 0.02);
      const previousPrice = basePrice + (Math.sin((i + 1) / 5) * basePrice * 0.02);
      const change = price - previousPrice;
      const changePercent = (change / previousPrice) * 100;
      
      data.push({
        date: format(date, 'yyyy-MM-dd'),
        price: Math.round(price * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100
      });
    }
    
    return data;
  };

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const data = generateHistoricalData();
      setHistoricalData(data);
      setLoading(false);
    }, 300);
  }, [selectedMetal]);

  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const data = historicalData.find(d => d.date === dateStr);
    setSelectedDateData(data || null);
  }, [selectedDate, historicalData]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    onDateSelect(date);
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = format(date, 'yyyy-MM-dd');
      const data = historicalData.find(d => d.date === dateStr);
      
      if (data) {
        const isPositive = data.change > 0;
        return (
          <div className={`w-1 h-1 rounded-full mx-auto mt-1 ${
            isPositive ? 'bg-green-500' : 'bg-red-500'
          }`} />
        );
      }
    }
    return null;
  };

  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = format(date, 'yyyy-MM-dd');
      const data = historicalData.find(d => d.date === dateStr);
      
      if (data) {
        const isPositive = data.change > 0;
        return `historical-tile ${isPositive ? 'positive' : 'negative'}`;
      }
    }
    return '';
  };

  return (
    <div className="space-y-4">
      <style jsx>{`
        .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
          background: transparent;
        }
        .react-calendar__tile {
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: none;
          background: none;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .react-calendar__tile:hover {
          background-color: #f1f5f9;
        }
        .react-calendar__tile--active {
          background-color: #f59e0b !important;
          color: white;
        }
        .react-calendar__tile--now {
          background-color: #e5e7eb;
          color: #374151;
        }
        .react-calendar__navigation {
          margin-bottom: 1rem;
        }
        .react-calendar__navigation__button {
          background: none;
          border: none;
          font-size: 0.875rem;
          color: #64748b;
          padding: 0.5rem;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .react-calendar__navigation__button:hover {
          background-color: #f1f5f9;
          color: #1e293b;
        }
        .react-calendar__month-view__weekdays {
          margin-bottom: 0.5rem;
        }
        .react-calendar__month-view__weekdays__weekday {
          text-align: center;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 500;
          padding: 0.5rem 0;
        }
        .historical-tile.positive {
          background-color: #dcfce7;
          color: #166534;
        }
        .historical-tile.negative {
          background-color: #fee2e2;
          color: #991b1b;
        }
      `}</style>

      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-900 capitalize">
          {selectedMetal} Historical Prices
        </h4>
        <CalendarIcon className="h-4 w-4 text-slate-400" />
      </div>

      <div className="bg-slate-50 rounded-lg p-4">
        <Calendar
          onChange={handleDateChange}
          value={selectedDate}
          tileContent={tileContent}
          tileClassName={tileClassName}
          maxDate={new Date()}
          minDate={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)} // 30 days ago
        />
      </div>

      {selectedDateData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-slate-900">
              {format(selectedDate, 'MMMM dd, yyyy')}
            </h5>
            <div className={`flex items-center space-x-1 text-sm ${
              selectedDateData.change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {selectedDateData.change >= 0 ? 
                <TrendingUp className="h-3 w-3" /> : 
                <TrendingDown className="h-3 w-3" />
              }
              <span>
                {selectedDateData.change >= 0 ? '+' : ''}
                {selectedDateData.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Price:</span>
              <span className="text-sm font-medium text-slate-900">
                ₹{selectedDateData.price.toLocaleString('en-IN', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-500">Change:</span>
              <span className={`text-sm font-medium ${
                selectedDateData.change >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {selectedDateData.change >= 0 ? '+' : ''}₹{Math.abs(selectedDateData.change).toFixed(2)}
              </span>
            </div>
          </div>
          
          {isToday(selectedDate) && (
            <div className="mt-3 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full inline-block">
              Today's Price
            </div>
          )}
        </motion.div>
      )}

      <div className="text-xs text-slate-500 space-y-1">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Price increased</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>Price decreased</span>
        </div>
      </div>
    </div>
  );
};

export default HistoricalCalendar;