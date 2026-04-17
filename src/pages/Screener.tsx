import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, RefreshCw, Sliders, BarChart2 } from 'lucide-react';

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

type Preset = 'all' | 'gainers' | 'losers' | 'volume';

export default function Screener() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [preset, setPreset] = useState<Preset>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadStocks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stocks, search, preset]);

  const loadStocks = async () => {
    try {
      const data = await fetch(`${API_URL}/stocks`).then(r => r.json()).catch(() => []);
      setStocks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...stocks];

    if (search) {
      result = result.filter(s =>
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    switch (preset) {
      case 'gainers':
        result = result.filter(s => s.percentageChange > 0)
          .sort((a, b) => b.percentageChange - a.percentageChange);
        break;
      case 'losers':
        result = result.filter(s => s.percentageChange < 0)
          .sort((a, b) => a.percentageChange - b.percentageChange);
        break;
      case 'volume':
        result = result.sort((a, b) => b.volume - a.volume).slice(0, 50);
        break;
      default:
        result = result.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }

    setFilteredStocks(result);
  };

  const formatVolume = (num: number) => {
    if (!num) return '—';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const presets: { id: Preset; label: string; icon: any; color: string }[] = [
    { id: 'all', label: 'All Stocks', icon: BarChart2, color: '' },
    { id: 'gainers', label: 'Top Gainers', icon: TrendingUp, color: 'text-gain' },
    { id: 'losers', label: 'Top Losers', icon: TrendingDown, color: 'text-loss' },
    { id: 'volume', label: 'High Volume', icon: Sliders, color: 'text-accent' },
  ];

  return (
    <div className="screener-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">SCREENER</h1>
          <span className="stock-count">{filteredStocks.length} results</span>
        </div>
        <button onClick={loadStocks} className="btn btn-ghost" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Preset Buttons */}
      <div className="preset-bar">
        {presets.map((p) => (
          <button
            key={p.id}
            className={`preset-btn ${preset === p.id ? 'active' : ''}`}
            onClick={() => setPreset(p.id)}
          >
            <p.icon size={14} className={p.color || 'text-muted'} />
            {p.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="search-container">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search symbol or company name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Company</th>
                <th className="text-right">Price</th>
                <th className="text-right">Change</th>
                <th className="text-right">Open</th>
                <th className="text-right">High</th>
                <th className="text-right">Low</th>
                <th className="text-right">Volume</th>
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
                  <td colSpan={8} className="empty-cell">No results</td>
                </tr>
              ) : (
                filteredStocks.map((stock, i) => (
                  <tr key={stock.symbol} onClick={() => navigate(`/stocks/${stock.symbol}`)}>
                    <td>
                      <div className="stock-rank">{i + 1}</div>
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
        .screener-page {
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

        .preset-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .preset-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-muted);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.1s;
        }

        .preset-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .preset-btn.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #000;
        }

        .search-container {
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
          padding: 12px 12px 12px 40px;
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

        .table-wrapper {
          overflow-x: auto;
        }

        .data-table th {
          white-space: nowrap;
        }

        .data-table td {
          white-space: nowrap;
        }

        .data-table tr td:first-child {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .stock-rank {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-tertiary);
          font-size: 0.7rem;
          color: var(--text-muted);
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
