import { useState, useEffect } from 'react';
import { Plus, Trash2, Bell, BellOff, Search } from 'lucide-react';

const STORAGE_KEY = 'nepse_price_alerts';
const API_URL = import.meta.env.VITE_API_URL || 'https://frontend-eight-tan-70.vercel.app/api';

interface Stock {
  symbol: string;
  name: string;
}

interface PriceAlert {
  id: number;
  symbol: string;
  target_price: number;
  condition: 'ABOVE' | 'BELOW';
  is_active: boolean;
  created_at: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    target_price: '',
    condition: 'ABOVE' as 'ABOVE' | 'BELOW',
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAlerts();
    loadStocks();
  }, []);

  const loadAlerts = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAlerts(JSON.parse(saved));
      } catch {
        setAlerts([]);
      }
    }
  };

  const loadStocks = async () => {
    try {
      const data = await fetch(`${API_URL}/stocks`).then(r => r.json()).catch(() => []);
      setStocks(data);
    } catch (error) {
      console.error('Error loading stocks:', error);
    }
  };

  const saveAlerts = (data: PriceAlert[]) => {
    setAlerts(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert: PriceAlert = {
      id: Date.now(),
      symbol: formData.symbol,
      target_price: parseFloat(formData.target_price),
      condition: formData.condition,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    saveAlerts([...alerts, newAlert]);
    setFormData({ symbol: '', target_price: '', condition: 'ABOVE' });
    setShowForm(false);
  };

  const toggleAlert = (id: number) => {
    saveAlerts(alerts.map((a) => (a.id === id ? { ...a, is_active: !a.is_active } : a)));
  };

  const deleteAlert = (id: number) => {
    if (confirm('Delete this alert?')) {
      saveAlerts(alerts.filter((a) => a.id !== id));
    }
  };

  const activeCount = alerts.filter((a) => a.is_active).length;

  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="alerts">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">PRICE ALERTS</h1>
        </div>
        <div className="header-right">
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            <Plus size={14} />
            Add Alert
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <span>NEW ALERT</span>
          </div>
          <form onSubmit={handleSubmit} className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Stock</label>
                <div className="search-container">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search stocks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="stock-select-list">
                  {filteredStocks.slice(0, 8).map((stock) => (
                    <div
                      key={stock.symbol}
                      onClick={() => { setFormData({ ...formData, symbol: stock.symbol }); setSearchQuery(''); }}
                      className={`stock-select-item ${formData.symbol === stock.symbol ? 'selected' : ''}`}
                    >
                      <div className="stock-avatar">{stock.symbol.slice(0, 2)}</div>
                      <div className="stock-info">
                        <div className="stock-symbol">{stock.symbol}</div>
                        <div className="stock-name">{stock.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {formData.symbol && (
                  <div className="selected-stock">
                    Selected: <strong>{formData.symbol}</strong>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Target Price (Rs.)</label>
                <input
                  type="number"
                  value={formData.target_price}
                  onChange={(e) => setFormData({ ...formData, target_price: e.target.value })}
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Condition</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value as 'ABOVE' | 'BELOW' })}
                  className="form-select"
                >
                  <option value="ABOVE">Price Above</option>
                  <option value="BELOW">Price Below</option>
                </select>
              </div>

              <div className="form-group form-actions">
                <button type="submit" className="btn btn-primary" disabled={!formData.symbol || !formData.target_price}>
                  Save
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="summary-card mb-4">
        <div className="summary-card-icon">
          <Bell size={20} />
        </div>
        <div>
          <div className="summary-card-label">Active Alerts</div>
          <div className="summary-card-value">{activeCount}</div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Target Price</th>
                <th>Condition</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48 }} className="text-muted">
                    No alerts set. Create your first alert above.
                  </td>
                </tr>
              ) : alerts.map((alert) => (
                <tr key={alert.id}>
                  <td className="font-mono font-semibold">{alert.symbol}</td>
                  <td className="font-mono">Rs. {alert.target_price.toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${alert.condition.toLowerCase()}`}>
                      {alert.condition === 'ABOVE' ? 'Above' : 'Below'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${alert.is_active ? 'active' : 'paused'}`}>
                      {alert.is_active ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="font-mono text-secondary">
                    {new Date(alert.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleAlert(alert.id)}
                        className="btn btn-ghost btn-icon"
                        title={alert.is_active ? 'Pause' : 'Activate'}
                      >
                        {alert.is_active ? <BellOff size={14} /> : <Bell size={14} />}
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="btn btn-ghost btn-icon text-loss"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .alerts {
          max-width: 1000px;
          margin: 0 auto;
        }

        .summary-card-icon {
          color: var(--accent);
          margin-right: 12px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          gap: 12px;
          align-items: start;
        }

        .form-group {
          margin-bottom: 0;
        }

        .form-label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 10px 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--accent);
        }

        .form-actions {
          display: flex;
          gap: 8px;
          align-items: flex-end;
        }

        .selected-stock {
          margin-top: 8px;
          padding: 8px 12px;
          background: var(--accent);
          color: var(--bg-primary);
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .stock-select-list {
          max-height: 100px;
          overflow-y: auto;
          margin-top: 4px;
          border: 1px solid var(--border);
          border-radius: 4px;
        }

        .stock-select-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .stock-select-item:hover {
          background: var(--bg-tertiary);
        }

        .stock-select-item.selected {
          background: var(--accent);
          color: var(--bg-primary);
        }

        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge-above {
          background: rgba(0, 200, 83, 0.15);
          color: #00c853;
        }

        .badge-below {
          background: rgba(255, 59, 48, 0.15);
          color: #ff6b6b;
        }

        .badge-active {
          background: rgba(0, 200, 83, 0.15);
          color: #00c853;
        }

        .badge-paused {
          background: rgba(100, 100, 100, 0.15);
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
}
