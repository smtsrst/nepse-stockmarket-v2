import { useState, useEffect } from 'react';
import { Activity, RefreshCw, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://nepse-backend-jv9v.onrender.com/api';

interface Stock {
  symbol: string;
  name: string;
  lastTradedPrice: number;
  percentageChange: number;
  volume: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
}

export default function Dashboard() {
  const [gainers, setGainers] = useState<Stock[]>([]);
  const [losers, setLosers] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      
      const [gainersData, losersData] = await Promise.all([
        fetch(`${API_URL}/stocks/gainers?limit=10`).then(r => r.json()),
        fetch(`${API_URL}/stocks/losers?limit=10`).then(r => r.json()),
      ]);
      
      setGainers(gainersData);
      setLosers(losersData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return 'N/A';
    if (num >= 10000000) return `Rs. ${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `Rs. ${(num / 100000).toFixed(2)} L`;
    return new Intl.NumberFormat('en-NP', { maximumFractionDigits: 0 }).format(num);
  };

  const formatPrice = (num: number | undefined) => {
    if (num === undefined || num === null) return 'N/A';
    return `Rs. ${num.toFixed(2)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Activity className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">NEPSE Dashboard</h1>
            <p className="text-text-secondary text-xs">Real-time market data</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdate && (
            <span className="text-text-secondary text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button 
            onClick={() => loadData(true)} 
            disabled={refreshing}
            className="p-2 text-text-secondary hover:text-accent rounded-lg hover:bg-bg-secondary transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Gainers */}
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight className="w-4 h-4 text-gain" />
            <h2 className="font-semibold text-text-primary">Top Gainers</h2>
          </div>
          {loading ? (
            <div className="text-center text-text-secondary py-8">Loading...</div>
          ) : (
            <div className="space-y-2">
              {gainers.map((stock) => (
                <div key={stock.symbol} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <div>
                    <div className="font-mono font-semibold text-text-primary">{stock.symbol}</div>
                    <div className="text-xs text-text-secondary">{stock.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-text-primary">{formatPrice(stock.lastTradedPrice)}</div>
                    <div className="text-xs text-gain">+{stock.percentageChange?.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Losers */}
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownRight className="w-4 h-4 text-loss" />
            <h2 className="font-semibold text-text-primary">Top Losers</h2>
          </div>
          {loading ? (
            <div className="text-center text-text-secondary py-8">Loading...</div>
          ) : (
            <div className="space-y-2">
              {losers.map((stock) => (
                <div key={stock.symbol} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <div>
                    <div className="font-mono font-semibold text-text-primary">{stock.symbol}</div>
                    <div className="text-xs text-text-secondary">{stock.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-text-primary">{formatPrice(stock.lastTradedPrice)}</div>
                    <div className="text-xs text-loss">{stock.percentageChange?.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
