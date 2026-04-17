import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, RefreshCw, Clock, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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

interface MarketSummary {
  total_turnover: number;
  total_trade: number;
  total_share: number;
  total_companies: number;
}

export default function Dashboard() {
  const [gainers, setGainers] = useState<Stock[]>([]);
  const [losers, setLosers] = useState<Stock[]>([]);
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      
      const [gainersData, losersData, summaryData] = await Promise.all([
        fetch(`${API_URL}/stocks/gainers?limit=10`).then(r => r.json()),
        fetch(`${API_URL}/stocks/losers?limit=10`).then(r => r.json()),
        fetch(`${API_URL}/market/summary`).then(r => r.json()),
      ]);
      
      setGainers(gainersData);
      setLosers(losersData);
      setSummary(summaryData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatCrores = (num: number) => {
    if (!num) return '0';
    return (num / 10000000).toFixed(2);
  };

  const formatVolume = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* Market Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
            <DollarSign className="w-4 h-4" />
            Total Turnover
          </div>
          <div className="text-xl font-bold text-text-primary">
            Rs. {formatCrores(summary?.total_turnover || 0)} Cr
          </div>
        </div>
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
            <BarChart3 className="w-4 h-4" />
            Total Trade
          </div>
          <div className="text-xl font-bold text-text-primary">
            {summary?.total_trade?.toLocaleString() || '0'}
          </div>
        </div>
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
            <PieChart className="w-4 h-4" />
            Total Shares
          </div>
          <div className="text-xl font-bold text-text-primary">
            {formatVolume(summary?.total_share || 0)}
          </div>
        </div>
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-text-secondary text-sm mb-2">
            <Activity className="w-4 h-4" />
            Companies
          </div>
          <div className="text-xl font-bold text-text-primary">
            {summary?.total_companies || 0}
          </div>
        </div>
      </div>

      {/* Gainers & Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Gainers */}
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gain" />
            <h2 className="font-semibold text-text-primary">Top Gainers</h2>
          </div>
          {loading ? (
            <div className="text-center text-text-secondary py-8">Loading...</div>
          ) : (
            <div className="space-y-2">
              {gainers.slice(0, 8).map((stock, i) => (
                <div 
                  key={stock.symbol} 
                  className="flex justify-between items-center py-2 border-b border-border/50 last:border-0 cursor-pointer hover:bg-bg-tertiary -mx-2 px-2 rounded transition-colors"
                  onClick={() => navigate(`/stocks/${stock.symbol}`)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-text-secondary text-xs w-5">{i + 1}</span>
                    <div>
                      <div className="font-mono font-semibold text-text-primary">{stock.symbol}</div>
                      <div className="text-xs text-text-secondary truncate max-w-[150px]">{stock.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-text-primary">Rs. {stock.lastTradedPrice}</div>
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
            <TrendingDown className="w-5 h-5 text-loss" />
            <h2 className="font-semibold text-text-primary">Top Losers</h2>
          </div>
          {loading ? (
            <div className="text-center text-text-secondary py-8">Loading...</div>
          ) : (
            <div className="space-y-2">
              {losers.slice(0, 8).map((stock, i) => (
                <div 
                  key={stock.symbol} 
                  className="flex justify-between items-center py-2 border-b border-border/50 last:border-0 cursor-pointer hover:bg-bg-tertiary -mx-2 px-2 rounded transition-colors"
                  onClick={() => navigate(`/stocks/${stock.symbol}`)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-text-secondary text-xs w-5">{i + 1}</span>
                    <div>
                      <div className="font-mono font-semibold text-text-primary">{stock.symbol}</div>
                      <div className="text-xs text-text-secondary truncate max-w-[150px]">{stock.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-text-primary">Rs. {stock.lastTradedPrice}</div>
                    <div className="text-xs text-loss">{stock.percentageChange?.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Market Status Banner */}
      <div className="bg-accent/10 border border-accent/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-accent">Live Data Feed</span>
          </div>
          <span className="text-xs text-text-secondary">
            Auto-refreshes every 60 seconds
          </span>
        </div>
      </div>
    </div>
  );
}
