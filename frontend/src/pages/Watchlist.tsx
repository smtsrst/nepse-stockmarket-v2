import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Plus, Trash2, TrendingUp, TrendingDown, Search } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://frontend-eight-tan-70.vercel.app/api';
const WATCHLIST_KEY = 'nepse_watchlist';

interface Stock {
  symbol: string;
  name: string;
  lastTradedPrice: number;
  percentageChange: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

export default function WatchlistPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const stockData = await fetch(`${API_URL}/stocks`).then(r => r.json()).catch(() => []);
      setStocks(stockData);

      const saved = localStorage.getItem(WATCHLIST_KEY);
      if (saved) {
        setWatchlist(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = () => {
    if (!selectedSymbol || watchlist.includes(selectedSymbol)) return;
    const updated = [...watchlist, selectedSymbol];
    setWatchlist(updated);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    setSelectedSymbol('');
    setShowAddModal(false);
  };

  const removeFromWatchlist = (symbol: string) => {
    if (!confirm(`Remove ${symbol} from watchlist?`)) return;
    const updated = watchlist.filter(s => s !== symbol);
    setWatchlist(updated);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
  };

  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const watchlistStocks = watchlist
    .map(symbol => stocks.find(s => s.symbol === symbol))
    .filter(Boolean) as Stock[];

  return (
    <div className="watchlist">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">WATCHLIST</h1>
        </div>
        <div className="header-right">
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={14} />
            Add Stock
          </button>
        </div>
      </div>

      {watchlistStocks.length === 0 ? (
        <div className="card text-center py-16">
          <Eye size={48} className="mx-auto mb-4 text-muted" />
          <h2 className="text-lg font-medium mb-2">No Stocks in Watchlist</h2>
          <p className="text-muted mb-4">Track stocks without owning them</p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={14} />
            Add Stock
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Change</th>
                  <th style={{ textAlign: 'right' }} className="hidden-md">Open</th>
                  <th style={{ textAlign: 'right' }} className="hidden-md">High</th>
                  <th style={{ textAlign: 'right' }} className="hidden-md">Low</th>
                  <th style={{ textAlign: 'right' }}>Volume</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {watchlistStocks.map((stock) => (
                  <tr key={stock.symbol} onClick={() => navigate(`/stocks/${stock.symbol}`)} style={{ cursor: 'pointer' }}>
                    <td className="font-mono font-semibold">{stock.symbol}</td>
                    <td className="text-secondary">{stock.name}</td>
                    <td className="font-mono" style={{ textAlign: 'right' }}>
                      Rs. {stock.lastTradedPrice?.toLocaleString()}
                    </td>
                    <td className={`font-mono ${stock.percentageChange >= 0 ? 'text-gain' : 'text-loss'}`} style={{ textAlign: 'right' }}>
                      {stock.percentageChange >= 0 ? '+' : ''}{stock.percentageChange?.toFixed(2)}%
                    </td>
                    <td className="font-mono text-secondary hidden-md" style={{ textAlign: 'right' }}>
                      Rs. {stock.open?.toLocaleString()}
                    </td>
                    <td className="font-mono text-secondary hidden-md" style={{ textAlign: 'right' }}>
                      Rs. {stock.high?.toLocaleString()}
                    </td>
                    <td className="font-mono text-secondary hidden-md" style={{ textAlign: 'right' }}>
                      Rs. {stock.low?.toLocaleString()}
                    </td>
                    <td className="font-mono text-secondary" style={{ textAlign: 'right' }}>
                      {stock.volume?.toLocaleString()}
                    </td>
                    <td>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFromWatchlist(stock.symbol); }}
                        className="btn btn-ghost btn-icon text-loss"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">ADD TO WATCHLIST</h2>
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-icon">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="search-container">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                  autoFocus
                />
              </div>
              <div className="stock-select-list">
                {loading ? (
                  <div className="loading-container"><div className="loading-spinner"></div></div>
                ) : filteredStocks.length === 0 ? (
                  <p className="text-center text-muted py-4">No stocks found</p>
                ) : filteredStocks.slice(0, 20).map((stock) => (
                  <div
                    key={stock.symbol}
                    onClick={() => { setSelectedSymbol(stock.symbol); addToWatchlist(); }}
                    className={`stock-select-item ${watchlist.includes(stock.symbol) ? 'disabled' : ''}`}
                  >
                    <div className="stock-avatar">{stock.symbol.slice(0, 2)}</div>
                    <div className="stock-info">
                      <div className="stock-symbol">{stock.symbol}</div>
                      <div className="stock-name">{stock.name}</div>
                    </div>
                    <div className="stock-price">
                      <span className={`text-gain ${stock.percentageChange >= 0 ? '' : 'text-loss'}`}>
                        {stock.percentageChange >= 0 ? '+' : ''}{stock.percentageChange?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .watchlist {
          max-width: 1400px;
          margin: 0 auto;
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
          padding: 10px 12px 10px 40px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .stock-select-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .stock-select-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .stock-select-item:hover {
          background: var(--bg-tertiary);
        }

        .stock-select-item.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .stock-select-item .stock-price {
          margin-left: auto;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .modal-content {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 6px;
          width: 100%;
          max-width: 480px;
          max-height: 80vh;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }

        .modal-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .modal-body {
          padding: 20px;
        }

        @media (max-width: 768px) {
          .hidden-md {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
