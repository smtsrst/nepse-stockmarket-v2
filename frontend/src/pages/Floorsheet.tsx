import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://frontend-eight-tan-70.vercel.app/api';

interface FloorsheetData {
  symbol: string;
  buyer_broker: string;
  seller_broker: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function Floorsheet() {
  const [floorsheet, setFloorsheet] = useState<FloorsheetData[]>([]);
  const [filteredSheet, setFilteredSheet] = useState<FloorsheetData[]>([]);
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFloorsheet();
  }, []);

  useEffect(() => {
    if (symbol) {
      setFilteredSheet(floorsheet.filter(f => f.symbol.toLowerCase() === symbol.toLowerCase()));
    } else {
      setFilteredSheet(floorsheet);
    }
  }, [symbol, floorsheet]);

  const loadFloorsheet = async () => {
    try {
      const data = await fetch(`${API_URL}/floorsheet`).then(r => r.json()).catch(() => []);
      setFloorsheet(Array.isArray(data) ? data : []);
      setFilteredSheet(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading floorsheet:', error);
      setFloorsheet([]);
      setFilteredSheet([]);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('en-NP', { maximumFractionDigits: 0 }).format(num);
  };

  const totalQuantity = filteredSheet.reduce((acc, f) => acc + (f.quantity || 0), 0);
  const totalAmount = filteredSheet.reduce((acc, f) => acc + (f.amount || 0), 0);

  return (
    <div className="floorsheet">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">FLOORSHEET</h1>
        </div>
      </div>

      <div className="card mb-4">
        <div className="search-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="search-input"
            placeholder="Filter by symbol..."
          />
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card-label">Transactions</div>
          <div className="summary-card-value">{filteredSheet.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Total Quantity</div>
          <div className="summary-card-value">{formatNumber(totalQuantity)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Total Amount</div>
          <div className="summary-card-value">Rs. {formatNumber(totalAmount)}</div>
        </div>
      </div>

      <div className="card mt-4">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : filteredSheet.length === 0 ? (
          <div className="empty-state">
            No floorsheet data available
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Buyer</th>
                  <th>Seller</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Rate</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredSheet.slice(0, 100).map((item, index) => (
                  <tr key={index}>
                    <td className="font-mono font-semibold">{item.symbol}</td>
                    <td className="text-secondary">{item.buyer_broker}</td>
                    <td className="text-secondary">{item.seller_broker}</td>
                    <td className="font-mono" style={{ textAlign: 'right' }}>
                      {formatNumber(item.quantity)}
                    </td>
                    <td className="font-mono" style={{ textAlign: 'right' }}>
                      Rs. {item.rate?.toLocaleString()}
                    </td>
                    <td className="font-mono" style={{ textAlign: 'right' }}>
                      Rs. {formatNumber(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredSheet.length > 100 && (
          <div className="text-center text-muted text-sm py-4">
            Showing first 100 of {filteredSheet.length} transactions
          </div>
        )}
      </div>

      <style>{`
        .floorsheet {
          max-width: 1200px;
          margin: 0 auto;
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
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}
