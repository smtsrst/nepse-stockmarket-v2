import { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, FileText, Search } from 'lucide-react';

const TRANSACTIONS_KEY = 'nepse_transactions';
const HOLDINGS_KEY = 'nepse_holdings';
const API_URL = import.meta.env.VITE_API_URL || 'https://frontend-eight-tan-70.vercel.app/api';

interface Stock {
  symbol: string;
  name: string;
}

interface Transaction {
  id: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  rate: number;
  amount: number;
  date: string;
  notes?: string;
}

interface Holding {
  symbol: string;
  quantity: number;
  avg_price: number;
  total_cost: number;
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    type: 'BUY' as 'BUY' | 'SELL',
    quantity: '',
    rate: '',
    notes: '',
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadStoredTransactions();
    loadStocks();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => loadStoredTransactions();
    window.addEventListener('holdingsUpdated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('holdingsUpdated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadStocks = async () => {
    try {
      const data = await fetch(`${API_URL}/stocks`).then(r => r.json()).catch(() => []);
      setStocks(data);
    } catch (error) {
      console.error('Error loading stocks:', error);
    }
  };

  const loadStoredTransactions = () => {
    const saved = localStorage.getItem(TRANSACTIONS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const sorted = parsed.sort((a: Transaction, b: Transaction) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setTransactions(sorted);
      } catch {
        setTransactions([]);
      }
    }
  };

  const saveAndRecalculate = (newTransactions: Transaction[]) => {
    const sorted = [...newTransactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setTransactions(sorted);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newTransactions));
    
    const holdingsMap: Record<string, { quantity: number; total_cost: number }> = {};
    
    newTransactions.forEach(t => {
      if (!holdingsMap[t.symbol]) {
        holdingsMap[t.symbol] = { quantity: 0, total_cost: 0 };
      }
      if (t.type === 'BUY') {
        holdingsMap[t.symbol].quantity += t.quantity;
        holdingsMap[t.symbol].total_cost += t.amount;
      } else {
        if (holdingsMap[t.symbol].quantity > 0) {
          const avgCost = holdingsMap[t.symbol].total_cost / holdingsMap[t.symbol].quantity;
          holdingsMap[t.symbol].quantity -= t.quantity;
          holdingsMap[t.symbol].total_cost = holdingsMap[t.symbol].quantity * avgCost;
        }
      }
    });

    const holdings: Holding[] = Object.entries(holdingsMap)
      .filter(([_, h]) => h.quantity > 0)
      .map(([symbol, h]) => ({
        symbol,
        quantity: h.quantity,
        avg_price: h.total_cost / h.quantity,
        total_cost: h.total_cost,
      }));

    localStorage.setItem(HOLDINGS_KEY, JSON.stringify(holdings));
    window.dispatchEvent(new CustomEvent('holdingsUpdated'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseInt(formData.quantity);
    const rate = parseFloat(formData.rate);
    const amount = quantity * rate;

    const newTransaction: Transaction = {
      id: Date.now(),
      symbol: formData.symbol,
      type: formData.type,
      quantity,
      rate,
      amount,
      date: new Date().toISOString().split('T')[0],
      notes: formData.notes || undefined,
    };

    saveAndRecalculate([newTransaction, ...transactions]);
    setFormData({ symbol: '', type: 'BUY', quantity: '', rate: '', notes: '' });
    setShowForm(false);
  };

  const deleteTransaction = (id: number) => {
    if (confirm('Delete this transaction? This will also update your portfolio.')) {
      saveAndRecalculate(transactions.filter((t) => t.id !== id));
    }
  };

  const totalBuy = transactions
    .filter((t) => t.type === 'BUY')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSell = transactions
    .filter((t) => t.type === 'SELL')
    .reduce((sum, t) => sum + t.amount, 0);
  const netInvestment = totalBuy - totalSell;

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(num);

  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="transactions">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">TRANSACTIONS</h1>
        </div>
        <div className="header-right">
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            <Plus size={14} />
            Add Transaction
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <span>NEW TRANSACTION</span>
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
                  {filteredStocks.slice(0, 10).map((stock) => (
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
                <label className="form-label">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'BUY' | 'SELL' })}
                  className="form-select"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="form-input"
                  placeholder="Number of shares"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rate (Rs.)</label>
                <input
                  type="number"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className="form-input"
                  placeholder="Price per share"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-input"
                  placeholder="Optional notes"
                />
              </div>

              <div className="form-group form-actions">
                <button type="submit" className="btn btn-primary" disabled={!formData.symbol || !formData.quantity || !formData.rate}>
                  Save Transaction
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card-label">Total Buys</div>
          <div className="summary-card-value text-loss">Rs. {totalBuy.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Total Sells</div>
          <div className="summary-card-value text-gain">Rs. {totalSell.toLocaleString()}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Net Investment</div>
          <div className={`summary-card-value ${netInvestment >= 0 ? 'text-loss' : 'text-gain'}`}>
            Rs. {netInvestment.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Symbol</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Rate</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48 }}>
                    <FileText size={32} className="mx-auto mb-4 text-muted" />
                    <p className="text-muted">No transactions yet</p>
                    <p className="text-muted text-sm">Add your first buy/sell transaction above.</p>
                  </td>
                </tr>
              ) : transactions.map((t) => (
                <tr key={t.id}>
                  <td className="font-mono">{t.date}</td>
                  <td className="font-mono font-semibold">{t.symbol}</td>
                  <td>
                    <span className={`badge badge-${t.type.toLowerCase()}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="font-mono" style={{ textAlign: 'right' }}>{t.quantity}</td>
                  <td className="font-mono" style={{ textAlign: 'right' }}>
                    Rs. {t.rate.toLocaleString()}
                  </td>
                  <td className="font-mono" style={{ textAlign: 'right' }}>
                    {formatCurrency(t.amount)}
                  </td>
                  <td>
                    <button
                      onClick={() => deleteTransaction(t.id)}
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

      <style>{`
        .transactions {
          max-width: 1200px;
          margin: 0 auto;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
          max-height: 120px;
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

        .badge-buy {
          background: rgba(255, 59, 48, 0.2);
          color: #ff6b6b;
        }

        .badge-sell {
          background: rgba(0, 200, 83, 0.2);
          color: #00c853;
        }

        @media (max-width: 768px) {
          .summary-grid {
            grid-template-columns: 1fr !important;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
