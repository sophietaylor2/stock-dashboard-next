'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  MA20: number;
  MA50: number;
  avg_20day_volume: number;
}

interface StockSummary {
  latest_price: number;
  '52_week_low': number;
  '52_week_high': number;
  price_position: number;
  avg_volume: number;
  weekly_return: number;
  monthly_return: number;
  yearly_return: number;
}

interface ApiResponse {
  data: {
    price_data: StockData[];
    volume_data: StockData[];
  };
  summary: StockSummary;
}

export default function Home() {
  const [ticker, setTicker] = useState('AAPL');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const defaultTickers = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META'];

  useEffect(() => {
    fetchStockData(ticker);
  }, [ticker]);

  const fetchStockData = async (symbol: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/stocks/${symbol}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(num);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const formatPercent = (percent: number) => {
    return new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 }).format(percent / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Stock Market Dashboard</h1>
        
        <div className="mb-8">
          <div className="flex justify-center space-x-4 mb-4">
            {defaultTickers.map((t) => (
              <button
                key={t}
                onClick={() => setTicker(t)}
                className={`px-4 py-2 rounded ${ticker === t ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              >
                {t}
              </button>
            ))}
          </div>
          
          <div className="flex justify-center space-x-4">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="px-4 py-2 rounded bg-gray-700 text-white"
              placeholder="Enter ticker (e.g., AAPL)"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded mb-8">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Latest Price</h3>
                <p className="text-2xl">{formatPrice(data.summary.latest_price)}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">52-Week Range</h3>
                <p className="text-2xl">
                  {formatPrice(data.summary['52_week_low'])} - {formatPrice(data.summary['52_week_high'])}
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Price Position</h3>
                <p className="text-2xl">{formatPercent(data.summary.price_position)}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Avg Volume</h3>
                <p className="text-2xl">{formatNumber(data.summary.avg_volume)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Weekly Return</h3>
                <p className={`text-2xl ${data.summary.weekly_return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercent(data.summary.weekly_return)}
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Monthly Return</h3>
                <p className={`text-2xl ${data.summary.monthly_return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercent(data.summary.monthly_return)}
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Yearly Return</h3>
                <p className={`text-2xl ${data.summary.yearly_return >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercent(data.summary.yearly_return)}
                </p>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <Plot
                data={[
                  {
                    x: data.data.price_data.map(d => d.date),
                    open: data.data.price_data.map(d => d.open),
                    high: data.data.price_data.map(d => d.high),
                    low: data.data.price_data.map(d => d.low),
                    close: data.data.price_data.map(d => d.close),
                    type: 'candlestick',
                    name: 'Price'
                  },
                  {
                    x: data.data.price_data.map(d => d.date),
                    y: data.data.price_data.map(d => d.MA20),
                    type: 'scatter',
                    name: '20-day MA',
                    line: { color: 'orange' }
                  },
                  {
                    x: data.data.price_data.map(d => d.date),
                    y: data.data.price_data.map(d => d.MA50),
                    type: 'scatter',
                    name: '50-day MA',
                    line: { color: 'blue' }
                  }
                ]}
                layout={{
                  title: 'Stock Price with Moving Averages',
                  yaxis: { title: 'Stock Price (USD)' },
                  xaxis: { title: 'Date' },
                  template: 'plotly_dark'
                }}
                useResizeHandler
                className="w-full h-[500px]"
              />
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <Plot
                data={[
                  {
                    x: data.data.volume_data.map(d => d.date),
                    y: data.data.volume_data.map(d => d.volume),
                    type: 'bar',
                    name: 'Volume'
                  },
                  {
                    x: data.data.volume_data.map(d => d.date),
                    y: data.data.volume_data.map(d => d.avg_20day_volume),
                    type: 'scatter',
                    name: '20-day Avg Volume',
                    line: { color: 'orange' }
                  }
                ]}
                layout={{
                  title: 'Trading Volume',
                  yaxis: { title: 'Volume' },
                  xaxis: { title: 'Date' },
                  template: 'plotly_dark'
                }}
                useResizeHandler
                className="w-full h-[500px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
