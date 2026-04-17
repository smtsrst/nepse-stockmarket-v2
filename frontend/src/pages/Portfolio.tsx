import { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown, Search } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://frontend-eight-tan-70.vercel.app/api';
const LOCAL_HOLDINGS_KEY = 'nepse_holdings';
const TRANSACTIONS_KEY = 'nepse_transactions';

interface Stock {
  symbol: string;
  name: string;
  lastTradedPrice: number;
  percentageChange: number;
}

interface LocalHolding {
  symbol: string;
  quantity: number;
  avg_price: number;
  total_cost: number;
  current_price?: number;
  current_value?: number;
  profit_loss?: number;
  profit_loss_percent?: number;
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

export default function PortfolioPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [localHoldings, setLocalHoldings] = useState<LocalHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddHolding, setShowAddHolding] = useState(false);
  const [newHolding, setNewHolding] = useState({ symbol: '', quantity: 0, avgPrice: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadStockPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => loadLocalHoldings();
    window.addEventListener('holdingsUpdated', handleStorageChange);
    return () => window.removeEventListener('holdingsUpdated', handleStorageChange);
  }, []);

  const loadData = async () => {
    try {
      const stockData = await fetch(`${API_URL}/stocks`).then(r => r.json()).catch(() => []);
      setStocks(stockData);
      loadLocalHoldings();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStockPrices = async () => {
    try {
      const stockData = await fetch(`${API_URL}/stocks`).then(r => r.json()).catch(() => []);
      setStocks(stockData);
      updateHoldingsWithPrices(stockData, localHoldings);
    } catch (error) {
      console.error('Error updating prices:', error);
    }
  };

  const loadLocalHoldings = () => {
    const saved = localStorage.getItem(LOCAL_HOLDINGS_KEY);
    if (saved) {
      try {
        const holdings: LocalHolding[] = JSON.parse(saved);
        setLocalHoldings(holdings);
      } catch {
        setLocalHoldings([]);
      }
    }
  };

  const updateHoldingsWithPrices = (stockData: Stock[], holdings: LocalHolding[]) => {
    const updated = holdings.map(h => {
      const stock = stockData.find(s => s.symbol === h.symbol);
      const current_price = stock?.lastTradedPrice || h.avg_price;
      const current_value = h.quantity * current_price;
      const profit_loss = current_value - h.total_cost;
      const profit_loss_percent = (profit_loss / h.total_cost) * 100;
      return { ...h, current_price, current_value, profit_loss, profit_loss_percent };
    });
    setLocalHoldings(updated);
  };

  const handleAddHolding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolding.symbol || newHolding.quantity <= 0) return;

    const quantity = newHolding.quantity;
    const rate = newHolding.avgPrice;
    const amount = quantity * rate;
    const transactionId = Date.now();

    const newTransaction: Transaction = {
      id: transactionId,
      symbol: newHolding.symbol,
      type: 'BUY',
      quantity,
      rate,
      amount,
      date: new Date().toISOString().split('T')[0],
    };

    const saved = localStorage.getItem(TRANSACTIONS_KEY);
    const existingTransactions: Transaction[] = saved ? JSON.parse(saved) : [];
    const updatedTransactions = [newTransaction, ...existingTransactions];
    
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
    updateLocalHoldings(updatedTransactions);
    window.dispatchEvent(new CustomEvent('holdingsUpdated'));
    
    setShowAddHolding(false);
    setNewHolding({ symbol: '', quantity: 0, avgPrice: 0 });
  };

  const updateLocalHoldings = (transactions: Transaction[]) => {
    const holdingsMap: Record<string, { quantity: number; total_cost: number }> = {};
    
    transactions.forEach(t => {
      if (!holdingsMap[t.symbol]) {
        holdingsMap[t.symbol] = { quantity: 0, total_cost: 0 };
      }
      if (t.type === 'BUY') {
        holdingsMap[t.symbol].quantity += t.quantity;
        holdingsMap[t.symbol].total_cost += t.amount;
      } else {
        const avgCost = holdingsMap[t.symbol].quantity > 0 
          ? holdingsMap[t.symbol].total_cost / holdingsMap[t.symbol].quantity 
          : 0;
        holdingsMap[t.symbol].quantity -= t.quantity;
        holdingsMap[t.symbol].total_cost = holdingsMap[t.symbol].quantity * avgCost;
      }
    });

    const holdings: LocalHolding[] = Object.entries(holdingsMap)
      .filter(([_, h]) => h.quantity > 0)
      .map(([symbol, h]) => ({
        symbol,
        quantity: h.quantity,
        avg_price: h.total_cost / h.quantity,
        total_cost: h.total_cost,
      }));

    localStorage.setItem(LOCAL_HOLDINGS_KEY, JSON.stringify(holdings));
    setLocalHoldings(holdings);
    updateHoldingsWithPrices(stocks, holdings);
  };

  const handleDeleteHolding = (symbol: string) => {
    const holding = localHoldings.find(h => h.symbol === symbol);
    if (!holding || !confirm(`Sell all ${symbol} from portfolio?`)) return;

    const newTransaction: Transaction = {
      id: Date.now(),
      symbol,
      type: 'SELL',
      quantity: holding.quantity,
      rate: holding.avg_price,
      amount: holding.total_cost,
      date: new Date().toISOString().split('T')[0],
    };

    const saved = localStorage.getItem(TRANSACTIONS_KEY);
    const existingTransactions: Transaction[] = saved ? JSON.parse(saved) : [];
    const updatedTransactions = [newTransaction, ...existingTransactions];
    
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
    updateLocalHoldings(updatedTransactions);
    window.dispatchEvent(new CustomEvent('holdingsUpdated'));
  };

  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalInvested = localHoldings.reduce((sum, h) => sum + h.total_cost, 0);
  const totalCurrentValue = localHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  return (
    <div className="portfolio">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">PORTFOLIO</h1>
        </div>
        <div className="header-right">
          <button onClick={() => setShowAddHolding(true)} className="btn btn-primary">
            <Plus size={14} />
            Add Stock
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : localHoldings.length === 0 ? (
        <div className="card text-center py-16">
          <Wallet size={48} className="mx-auto mb-4 text-muted" />
          <h2 className="text-lg font-medium mb-2">No Holdings</h2>
          <p className="text-muted mb-4">Add your first stock to track your portfolio</p>
          <button onClick={() => setShowAddHolding(true)} className="btn btn-primary">
            <Plus size={14} />
            Add Stock
          </button>
        </div>
      ) : (
        <>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-card-label">Total Invested</div>
              <div className="summary-card-value">Rs. {totalInvested.toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Current Value</div>
              <div className="summary-card-value">Rs. {totalCurrentValue.toLocaleString()}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Profit/Loss</div>
              <div className={`summary-card-value ${totalProfitLoss >= 0 ? 'text-gain' : 'text-loss'}`}>
                {totalProfitLoss >= 0 ? '+' : ''}Rs. {totalProfitLoss.toLocaleString()}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card-label">Return</div>
              <div className={`summary-card-value ${totalProfitLossPercent >= 0 ? 'text-gain' : 'text-loss'}`}>
                {totalProfitLossPercent >= 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th style={{ textAlign: 'right' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Avg Price</th>
                    <th style={{ textAlign: 'right' }}>Current</th>
                    <th style={{ textAlign: 'right' }}>Value</th>
                    <th style={{ textAlign: 'right' }}>P/L</th>
                    <th style={{ textAlign: 'right' }}>P/L %</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {localHoldings.map((holding) => (
                    <tr key={holding.symbol}>
                      <td className="font-mono font-semibold">{holding.symbol}</td>
                      <td className="font-mono" style={{ textAlign: 'right' }}>{holding.quantity}</td>
                      <td className="font-mono" style={{ textAlign: 'right' }}>
                        Rs. {holding.avg_price?.toLocaleString()}
                      </td>
                      <td className="font-mono" style={{ textAlign: 'right' }}>
                        Rs. {(holding.current_price || holding.avg_price)?.toLocaleString()}
                      </td>
                      <td className="font-mono" style={{ textAlign: 'right' }}>
                        Rs. {(holding.current_value || holding.total_cost)?.toLocaleString()}
                      </td>
                      <td className={`font-mono ${(holding.profit_loss || 0) >= 0 ? 'text-gain' : 'text-loss'}`} style={{ textAlign: 'right' }}>
                        {(holding.profit_loss || 0) >= 0 ? '+' : ''}Rs. {(holding.profit_loss || 0).toLocaleString()}
                      </td>
                      <td className={`font-mono ${(holding.profit_loss_percent || 0) >= 0 ? 'text-gain' : 'text-loss'}`} style={{ textAlign: 'right' }}>
                        {(holding.profit_loss_percent || 0) >= 0 ? '+' : ''}{(holding.profit_loss_percent || 0).toFixed(2)}%
                      </td>
                      <td>
                        <button
                          onClick={() => handleDeleteHolding(holding.symbol)}
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
        </>
      )}

      {showAddHolding && (
        <div className="modal-overlay" onClick={() => setShowAddHolding(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">ADD STOCK</h2>
              <button onClick={() => setShowAddHolding(false)} className="btn btn-ghost btn-icon">
                ×
              </button>
            </div>
            <form onSubmit={handleAddHolding}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Stock</label>
                  <div className="search-container">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search stocks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <div className="stock-select-list">
                    {filteredStocks.slice(0, 15).map((stock) => (
                      <div
                        key={stock.symbol}
                        onClick={() => { setNewHolding({ ...newHolding, symbol: stock.symbol }); setSearchQuery(''); }}
                        className={`stock-select-item ${newHolding.symbol === stock.symbol ? 'selected' : ''}`}
                      >
                        <div className="stock-avatar">{stock.symbol.slice(0, 2)}</div>
                        <div className="stock-info">
                          <div className="stock-symbol">{stock.symbol}</div>
                          <div className="stock-name">{stock.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {newHolding.symbol && (
                    <div className="selected-stock">
                      Selected: <strong>{newHolding.symbol}</strong>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    value={newHolding.quantity || ''}
                    onChange={(e) => setNewHolding({ ...newHolding, quantity: parseInt(e.target.value) || 0 })}
                    className="form-input"
                    placeholder="Number of shares"
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Average Price (Rs.)</label>
                  <input
                    type="number"
                    value={newHolding.avgPrice || ''}
                    onChange={(e) => setNewHolding({ ...newHolding, avgPrice: parseFloat(e.target.value) || 0 })}
                    className="form-input"
                    placeholder="Average purchase price"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowAddHolding(false)} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!newHolding.symbol || newHolding.quantity <= 0}>
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .portfolio {
          max-width: 1400px;
          margin: 0 auto;
        }

        .selected-stock {
          margin-top: 8px;
          padding: 8px 12px;
          background: var(--accent);
          color: var(--bg-primary);
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .stock-select-list {
          max-height: 150px;
          overflow-y: auto;
          margin-top: 8px;
          border: 1px solid var(--border);
          border-radius: 4px;
        }

        .stock-select-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
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

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 16px 20px;
          border-top: 1px solid var(--border);
        }

        @media (max-width: 768px) {
          .summary-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
