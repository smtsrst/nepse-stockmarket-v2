import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Activity, Brain, BarChart3 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://frontend-eight-tan-70.vercel.app/api';

interface Stock {
  symbol: string;
  name: string;
  lastTradedPrice: number;
  percentageChange: number;
}

export default function Analysis() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      const data = await fetch(`${API_URL}/stocks?limit=500`).then(r => r.json());
      setStocks(data);
    } catch (error) {
      console.error('Error loading stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocks
    .filter(stock => 
      stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
      stock.name.toLowerCase().includes(search.toLowerCase())
    )
    .slice(0, 20);

  return (
    <div className="analysis">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">STOCK ANALYSIS</h1>
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <Activity size={20} />
          </div>
          <div className="feature-title">Technical Analysis</div>
          <div className="feature-desc">
            RSI, MACD, Moving Averages, Bollinger Bands and trend detection
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <Brain size={20} />
          </div>
          <div className="feature-title">ML Predictions</div>
          <div className="feature-desc">
            Random Forest model predicting next-day price movement
          </div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <BarChart3 size={20} />
          </div>
          <div className="feature-title">Price History</div>
          <div className="feature-desc">
            Interactive charts with multiple time range options
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <span>SELECT A STOCK</span>
        </div>
        <div className="card-body">
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search for a stock symbol or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Change</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 32 }}>
                    <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: 32 }} className="text-muted">
                    {search ? 'No stocks found' : 'Loading...'}
                  </td>
                </tr>
              ) : filteredStocks.map((stock) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center mt-4 text-muted text-sm">
        Or browse all stocks from the{' '}
        <span onClick={() => navigate('/stocks')} className="link">
          Stocks page
        </span>
      </div>

      <style>{`
        .analysis {
          max-width: 1000px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .feature-card {
          padding: 20px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 6px;
        }

        .feature-icon {
          color: var(--accent);
          margin-bottom: 12px;
        }

        .feature-title {
          font-weight: 600;
          margin-bottom: 8px;
        }

        .feature-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .search-container {
          position: relative;
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
          padding: 12px 12px 12px 40px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .link {
          color: var(--accent);
          cursor: pointer;
        }

        .link:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
