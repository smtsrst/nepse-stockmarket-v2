import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'https://frontend-eight-tan-70.vercel.app/api';

interface Stock {
  symbol: string;
  name: string;
  lastTradedPrice: number;
  percentageChange: number;
  volume: number;
}

interface MarketSummary {
  total_turnover: number;
  total_trade: number;
  total_share: number;
  total_companies: number;
}

interface ChartData {
  date: string;
  price: number;
}

export default function Dashboard() {
  const [gainers, setGainers] = useState<Stock[]>([]);
  const [losers, setLosers] = useState<Stock[]>([]);
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      
      const [gainersData, losersData, summaryData, stocksData, historyData] = await Promise.all([
        fetch(`${API_URL}/stocks/gainers?limit=5`).then(r => r.json()),
        fetch(`${API_URL}/stocks/losers?limit=5`).then(r => r.json()),
        fetch(`${API_URL}/market/summary`).then(r => r.json()).catch(() => null),
        fetch(`${API_URL}/stocks`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/history?symbol=NABIL&days=30`).then(r => r.json()).catch(() => null),
      ]);
      
      setGainers(gainersData.slice(0, 5) || []);
      setLosers(losersData.slice(0, 5) || []);
      setSummary(summaryData);
      setAllStocks(stocksData.slice(0, 20) || []);
      
      if (historyData?.history) {
        setChartData(historyData.history.map((h: any) => ({
          date: h.date?.slice(5) || '',
          price: h.close,
        })).reverse());
      }
      
      setLastUpdate(new Date().toLocaleTimeString());
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
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">DASHBOARD</h1>
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>Live</span>
          </div>
        </div>
        <div className="header-right">
          <span className="last-update">Updated {lastUpdate}</span>
          <button 
            onClick={() => loadData(true)} 
            disabled={refreshing}
            className="btn btn-ghost"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card-label">Total Turnover</div>
          <div className="summary-card-value">
            Rs. {formatCrores(summary?.total_turnover || 0)} Cr
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Total Trade</div>
          <div className="summary-card-value">
            {summary?.total_trade?.toLocaleString() || '—'}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Total Shares</div>
          <div className="summary-card-value">
            {formatVolume(summary?.total_share || 0)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Companies</div>
          <div className="summary-card-value">
            {summary?.total_companies || '—'}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Top Gainer</div>
          <div className="summary-card-value text-gain">
            {gainers[0]?.symbol || '—'}
          </div>
          {gainers[0] && (
            <div className="summary-card-change text-gain">
              +{gainers[0].percentageChange?.toFixed(2)}%
            </div>
          )}
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Top Loser</div>
          <div className="summary-card-value text-loss">
            {losers[0]?.symbol || '—'}
          </div>
          {losers[0] && (
            <div className="summary-card-change text-loss">
              {losers[0].percentageChange?.toFixed(2)}%
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="main-grid">
        {/* Chart */}
        <div className="card chart-card">
          <div className="card-header">
            <span>NABIL BANK - 30 Day Performance</span>
          </div>
          <div className="card-body chart-body">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00c853" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00c853" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#444" 
                    tick={{ fill: '#666', fontSize: 10 }}
                    axisLine={{ stroke: '#222' }}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#444" 
                    tick={{ fill: '#666', fontSize: 10 }}
                    axisLine={{ stroke: '#222' }}
                    tickLine={false}
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => `Rs ${v}`}
                    width={70}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#111', 
                      border: '1px solid #222',
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Price']}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#00c853"
                    strokeWidth={1.5}
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <span>No chart data available</span>
              </div>
            )}
          </div>
        </div>

        {/* Top Gainers */}
        <div className="card list-card">
          <div className="card-header">
            <span className="flex items-center gap-2">
              <TrendingUp size={14} className="text-gain" />
              TOP GAINERS
            </span>
          </div>
          <div className="list-body">
            {loading ? (
              <div className="loading-container"><div className="loading-spinner"></div></div>
            ) : (
              gainers.map((stock, i) => (
                <div 
                  key={stock.symbol}
                  className="stock-row"
                  onClick={() => navigate(`/stocks/${stock.symbol}`)}
                >
                  <div className="stock-info">
                    <div className="stock-avatar">{stock.symbol.slice(0, 2)}</div>
                    <div>
                      <div className="stock-symbol">{stock.symbol}</div>
                      <div className="stock-name">{stock.name}</div>
                    </div>
                  </div>
                  <div className="stock-price-col">
                    <span className="stock-price">Rs. {stock.lastTradedPrice?.toLocaleString()}</span>
                    <span className="stock-change text-gain">
                      +{stock.percentageChange?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Losers */}
        <div className="card list-card">
          <div className="card-header">
            <span className="flex items-center gap-2">
              <TrendingDown size={14} className="text-loss" />
              TOP LOSERS
            </span>
          </div>
          <div className="list-body">
            {loading ? (
              <div className="loading-container"><div className="loading-spinner"></div></div>
            ) : (
              losers.map((stock, i) => (
                <div 
                  key={stock.symbol}
                  className="stock-row"
                  onClick={() => navigate(`/stocks/${stock.symbol}`)}
                >
                  <div className="stock-info">
                    <div className="stock-avatar">{stock.symbol.slice(0, 2)}</div>
                    <div>
                      <div className="stock-symbol">{stock.symbol}</div>
                      <div className="stock-name">{stock.name}</div>
                    </div>
                  </div>
                  <div className="stock-price-col">
                    <span className="stock-price">Rs. {stock.lastTradedPrice?.toLocaleString()}</span>
                    <span className="stock-change text-loss">
                      {stock.percentageChange?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* All Stocks Table */}
      <div className="card mt-4">
        <div className="card-header">
          <span>ALL STOCKS</span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Change</th>
                <th style={{ textAlign: 'right' }}>Volume</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 32 }}>
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : allStocks.slice(0, 15).map((stock) => (
                <tr 
                  key={stock.symbol}
                  onClick={() => navigate(`/stocks/${stock.symbol}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="font-mono font-semibold">{stock.symbol}</td>
                  <td className="text-secondary">{stock.name}</td>
                  <td className="font-mono" style={{ textAlign: 'right' }}>
                    Rs. {stock.lastTradedPrice?.toLocaleString()}
                  </td>
                  <td className={`font-mono ${stock.percentageChange >= 0 ? 'text-gain' : 'text-loss'}`} style={{ textAlign: 'right' }}>
                    {stock.percentageChange >= 0 ? '+' : ''}{stock.percentageChange?.toFixed(2)}%
                  </td>
                  <td className="font-mono text-secondary" style={{ textAlign: 'right' }}>
                    {formatVolume(stock.volume)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .dashboard {
          max-width: 1600px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .page-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .last-update {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .main-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 12px;
        }

        .chart-card {
          grid-column: 1;
          grid-row: 1 / 3;
        }

        .chart-body {
          padding: 8px;
        }

        .list-body {
          max-height: 300px;
          overflow-y: auto;
        }

        .table-container {
          overflow-x: auto;
        }

        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
        }

        @media (max-width: 1200px) {
          .main-grid {
            grid-template-columns: 1fr 1fr;
          }
          .chart-card {
            grid-column: 1 / 3;
            grid-row: auto;
          }
        }

        @media (max-width: 768px) {
          .main-grid {
            grid-template-columns: 1fr;
          }
          .chart-card {
            grid-column: 1;
          }
          .summary-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
