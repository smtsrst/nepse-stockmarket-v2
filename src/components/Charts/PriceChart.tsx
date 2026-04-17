import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../../api/client';

interface PriceChartProps {
  symbol: string;
}

interface ChartData {
  date: string;
  price: number;
  volume?: number;
}

const timeRanges = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
];

export default function PriceChart({ symbol }: PriceChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    loadData();
  }, [symbol, range]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.getStockHistory(symbol, range);
      if (response.history) {
        const chartData = response.history.map((h: any) => ({
          date: h.date,
          open: h.open,
          high: h.high,
          low: h.low,
          close: h.close,
          price: h.close,
          volume: h.volume,
        }));
        setData(chartData);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-text-secondary">Loading chart...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-text-secondary">No data available</div>
      </div>
    );
  }

  const minPrice = Math.min(...data.map(d => d.price));
  const maxPrice = Math.max(...data.map(d => d.price));
  const isPositive = data.length > 1 && data[data.length - 1].price >= data[0].price;

  const formatDate = (date: string) => {
    const d = new Date(date);
    if (range <= 7) return `${d.getMonth() + 1}/${d.getDate()}`;
    if (range <= 30) return `${d.getMonth() + 1}/${d.getDate()}`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <div className="space-y-4">
      {/* Time range selector */}
      <div className="flex gap-2">
        {timeRanges.map((r) => (
          <button
            key={r.days}
            onClick={() => setRange(r.days)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              range === r.days
                ? 'bg-accent text-bg-primary font-medium'
                : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Price Stats */}
      <div className="grid grid-cols-4 gap-2 text-sm">
        <div className="p-2 bg-bg-tertiary rounded">
          <div className="text-text-secondary text-xs">High</div>
          <div className="text-gain font-medium">Rs. {maxPrice.toFixed(2)}</div>
        </div>
        <div className="p-2 bg-bg-tertiary rounded">
          <div className="text-text-secondary text-xs">Low</div>
          <div className="text-loss font-medium">Rs. {minPrice.toFixed(2)}</div>
        </div>
        <div className="p-2 bg-bg-tertiary rounded">
          <div className="text-text-secondary text-xs">Change</div>
          <div className={`font-medium ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {isPositive ? '+' : ''}{((data[data.length - 1]?.price - data[0]?.price) / data[0]?.price * 100).toFixed(2)}%
          </div>
        </div>
        <div className="p-2 bg-bg-tertiary rounded">
          <div className="text-text-secondary text-xs">Avg Vol</div>
          <div className="text-text-primary font-medium">
            {Math.round(data.reduce((acc, d) => acc + (d.volume || 0), 0) / data.length / 1000)}K
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? '#22c55e' : '#ef4444'}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? '#22c55e' : '#ef4444'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fill: '#a3a3a3', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#333333' }}
              tickFormatter={formatDate}
              minTickGap={30}
            />
            <YAxis
              domain={[minPrice * 0.98, maxPrice * 1.02]}
              tick={{ fill: '#a3a3a3', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `Rs.${value}`}
              width={65}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333333',
                borderRadius: '4px',
                color: '#e5e5e5',
              }}
              labelStyle={{ color: '#a3a3a3' }}
              formatter={(value: number) => [`Rs. ${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? '#22c55e' : '#ef4444'}
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}