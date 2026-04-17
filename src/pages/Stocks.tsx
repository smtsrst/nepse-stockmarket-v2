import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://frontend-eight-tan-70.vercel.app/api';

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

export default function Stocks() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [gainers, setGainers] = useState<Stock[]>([]);
  const [losers, setLosers] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'gainers' | 'losers'>('all');
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change' | 'volume'>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const navigate = useNavigate();

  useEffect(() => {
    loadStocks();
    const interval = setInterval(loadStocks, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStocks = async () => {
    try {
      const [allData, gainersData, losersData] = await Promise.all([
        fetch(`${API_URL}/stocks`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/stocks/gainers?limit=50`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/stocks/losers?limit=50`).then(r => r.json()).catch(() => []),
      ]);
      setStocks(Array.isArray(allData) ? allData : []);
      setGainers(Array.isArray(gainersData) ? gainersData : []);
      setLosers(Array.isArray(losersData) ? losersData : []);
    } catch (error) {
      console.error('Error loading stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredStocks = () => {
    let data: Stock[] = [];
    switch (activeTab) {
      case 'gainers': data = gainers; break;
      case 'losers': data = losers; break;
      default: data = stocks;
    }
    
    if (search) {
      data = data.filter(stock => 
        stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
        stock.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    return data.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'symbol': comparison = a.symbol.localeCompare(b.symbol); break;
        case 'price': comparison = a.lastTradedPrice - b.lastTradedPrice; break;
        case 'change': comparison = a.percentageChange - b.percentageChange; break;
        case 'volume': comparison = a.volume - b.volume; break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const toggleSort = (column: 'symbol' | 'price' | 'change' | 'volume') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder(column === 'symbol' ? 'asc' : 'desc');
    }
  };

  const formatVolume = (num: number) => {
    if (!num) return '—';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const filteredStocks = getFilteredStocks();

  return (
    <div className="stocks-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">STOCKS</h1>
          <span className="stock-count">{filteredStocks.length} instruments</span>
        </div>
        <button onClick={loadStocks} className="btn btn-ghost" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search symbol or company name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>×</button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Stocks
        </button>
        <button 
          className={`tab ${activeTab === 'gainers' ? 'active' : ''}`}
          onClick={() => setActiveTab('gainers')}
        >
          <TrendingUp size={14} className="text-gain" />
          Gainers
        </button>
        <button 
          className={`tab ${activeTab === 'losers' ? 'active' : ''}`}
          onClick={() => setActiveTab('losers')}
        >
          <TrendingDown size={14} className="text-loss" />
          Losers
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('symbol')} className="sortable">
                  <span>Symbol</span>
                  {sortBy === 'symbol' && (
                    <ArrowUpDown size={12} className={sortOrder === 'asc' ? 'sort-asc' : 'sort-desc'} />
                  )}
                </th>
                <th>Company</th>
                <th onClick={() => toggleSort('price')} className="sortable text-right">
                  <span>Price</span>
                  {sortBy === 'price' && (
                    <ArrowUpDown size={12} className={sortOrder === 'asc' ? 'sort-asc' : 'sort-desc'} />
                  )}
                </th>
                <th onClick={() => toggleSort('change')} className="sortable text-right">
                  <span>Change</span>
                  {sortBy === 'change' && (
                    <ArrowUpDown size={12} className={sortOrder === 'asc' ? 'sort-asc' : 'sort-desc'} />
                  )}
                </th>
                <th className="text-right">Open</th>
                <th className="text-right">High</th>
                <th className="text-right">Low</th>
                <th onClick={() => toggleSort('volume')} className="sortable text-right">
                  <span>Volume</span>
                  {sortBy === 'volume' && (
                    <ArrowUpDown size={12} className={sortOrder === 'asc' ? 'sort-asc' : 'sort-desc'} />
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="loading-cell">
                    <div className="loading-spinner"></div>
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    No stocks found
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => (
                  <tr 
                    key={stock.symbol} 
                    onClick={() => navigate(`/stocks/${stock.symbol}`)}
                  >
                    <td>
                      <span className="symbol-cell">{stock.symbol}</span>
                    </td>
                    <td className="company-cell">{stock.name}</td>
                    <td className="text-right font-mono">
                      Rs. {stock.lastTradedPrice?.toLocaleString()}
                    </td>
                    <td className="text-right">
                      <span className={`badge ${stock.percentageChange >= 0 ? 'badge-gain' : 'badge-loss'}`}>
                        {stock.percentageChange >= 0 ? '+' : ''}{stock.percentageChange?.toFixed(2)}%
                      </span>
                    </td>
                    <td className="text-right font-mono text-secondary">
                      Rs. {stock.openPrice?.toLocaleString()}
                    </td>
                    <td className="text-right font-mono text-gain">
                      Rs. {stock.highPrice?.toLocaleString()}
                    </td>
                    <td className="text-right font-mono text-loss">
                      Rs. {stock.lowPrice?.toLocaleString()}
                    </td>
                    <td className="text-right font-mono text-secondary">
                      {formatVolume(stock.volume)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .stocks-page {
          max-width: 1600px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .header-left {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .page-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .stock-count {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .search-bar {
          position: relative;
          margin-bottom: 16px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-input {
          width: 100%;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          padding: 10px 36px 10px 40px;
          font-size: 0.85rem;
          color: var(--text-primary);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .search-input::placeholder {
          color: var(--text-muted);
        }

        .search-clear {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 1.2rem;
          cursor: pointer;
        }

        .search-clear:hover {
          color: var(--text-primary);
        }

        .tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: transparent;
          border: none;
          font-size: 0.85rem;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.1s;
        }

        .tab:hover {
          color: var(--text-primary);
          background: var(--bg-tertiary);
        }

        .tab.active {
          color: var(--text-primary);
          background: var(--bg-secondary);
          border-bottom: 2px solid var(--accent);
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .data-table th {
          white-space: nowrap;
        }

        .data-table td {
          white-space: nowrap;
        }

        .sortable {
          cursor: pointer;
          user-select: none;
        }

        .sortable:hover {
          color: var(--text-primary);
        }

        .sortable span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .sort-asc, .sort-desc {
          color: var(--accent);
        }

        .symbol-cell {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          color: var(--accent);
        }

        .company-cell {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .loading-cell, .empty-cell {
          text-align: center;
          padding: 48px;
          color: var(--text-muted);
        }

        .loading-spinner {
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}
