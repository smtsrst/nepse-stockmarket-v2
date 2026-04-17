import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, BarChart2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://frontend-eight-tan-70.vercel.app/api';

interface Stock {
  symbol: string;
  name: string;
  lastTradedPrice: number;
  percentageChange: number;
  volume: number;
}

export default function Heatmap() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetch(`${API_URL}/stocks`).then(r => r.json()).catch(() => []);
      setStocks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getColor = (change: number) => {
    const maxChange = 5;
    const normalized = Math.max(-maxChange, Math.min(maxChange, change)) / maxChange;
    
    if (normalized >= 0) {
      const intensity = Math.round(normalized * 255);
      return `rgba(0, ${200 + (55 - intensity)}, 83, ${0.3 + normalized * 0.7})`;
    } else {
      const intensity = Math.round(Math.abs(normalized) * 255);
      return `rgba(${239}, ${68 - intensity * 0.5}, ${68 - intensity * 0.5}, ${0.3 + Math.abs(normalized) * 0.7})`;
    }
  };

  const getTextColor = (change: number) => {
    return change >= 0 ? '#00ff41' : '#ff3333';
  };

  return (
    <div className="heatmap-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">SECTOR HEATMAP</h1>
          <span className="stock-count">{stocks.length} stocks</span>
        </div>
        <button onClick={loadData} className="btn btn-ghost" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-card-label">Total Gainers</span>
          <span className="summary-card-value text-gain">
            {stocks.filter(s => s.percentageChange > 0).length}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-card-label">Total Losers</span>
          <span className="summary-card-value text-loss">
            {stocks.filter(s => s.percentageChange < 0).length}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-card-label">Avg Change</span>
          <span className="summary-card-value">
            {stocks.length > 0 
              ? (stocks.reduce((sum, s) => sum + s.percentageChange, 0) / stocks.length).toFixed(2)
              : 0}%
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-card-label">Top Gainer</span>
          <span className="summary-card-value text-gain">
            {stocks.sort((a, b) => b.percentageChange - a.percentageChange)[0]?.symbol || '—'}
          </span>
        </div>
      </div>

      {/* Heatmap */}
      <div className="card">
        <div className="card-header">
          <span>MARKET HEATMAP</span>
          <span className="text-xs text-muted">Colored by daily change</span>
        </div>
        <div className="heatmap-container">
          {loading ? (
            <div className="loading-container"><div className="loading-spinner"></div></div>
          ) : (
            <div className="heatmap-grid">
              {stocks.sort((a, b) => b.percentageChange - a.percentageChange).map((stock) => (
                <div
                  key={stock.symbol}
                  className="heatmap-cell"
                  style={{
                    background: getColor(stock.percentageChange),
                    borderColor: stock.percentageChange >= 0 ? '#00c853' : '#ff3333',
                  }}
                  onClick={() => navigate(`/stocks/${stock.symbol}`)}
                >
                  <div className="heatmap-symbol" style={{ color: getTextColor(stock.percentageChange) }}>
                    {stock.symbol}
                  </div>
                  <div className="heatmap-change" style={{ color: getTextColor(stock.percentageChange) }}>
                    {stock.percentageChange >= 0 ? '+' : ''}{stock.percentageChange?.toFixed(2)}%
                  </div>
                  <div className="heatmap-price">
                    Rs. {stock.lastTradedPrice?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="card">
        <div className="card-header">LEGEND</div>
        <div className="legend-container">
          <div className="legend-item">
            <div className="legend-color" style={{ background: 'rgba(0, 255, 65, 1)' }}></div>
            <span>+5%</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: 'rgba(0, 200, 83, 0.5)' }}></div>
            <span>+2.5%</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: 'rgba(100, 100, 100, 0.3)' }}></div>
            <span>0%</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: 'rgba(239, 100, 100, 0.5)' }}></div>
            <span>-2.5%</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: 'rgba(255, 51, 51, 1)' }}></div>
            <span>-5%</span>
          </div>
        </div>
      </div>

      <style>{`
        .heatmap-page {
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

        .heatmap-container {
          padding: 16px;
        }

        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 8px;
        }

        .heatmap-cell {
          padding: 12px;
          cursor: pointer;
          transition: all 0.1s;
          border: 1px solid transparent;
        }

        .heatmap-cell:hover {
          transform: scale(1.02);
          z-index: 1;
        }

        .heatmap-symbol {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 700;
          font-size: 0.9rem;
          margin-bottom: 4px;
        }

        .heatmap-change {
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .heatmap-price {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 4px;
        }

        .legend-container {
          display: flex;
          gap: 24px;
          padding: 16px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .legend-color {
          width: 20px;
          height: 20px;
        }

        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
        }
      `}</style>
    </div>
  );
}
