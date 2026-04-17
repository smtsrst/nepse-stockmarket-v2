import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Wallet, Plus, Trash2 } from 'lucide-react';
import type { Portfolio, PortfolioPerformance } from '../types';
import StockSelect from '../components/StockSelect';

const LOCAL_HOLDINGS_KEY = 'nepse_holdings';
const TRANSACTIONS_KEY = 'nepse_transactions';

interface LocalHolding {
  symbol: string;
  quantity: number;
  avg_price: number;
  total_cost: number;
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
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [performance, setPerformance] = useState<PortfolioPerformance | null>(null);
  const [localHoldings, setLocalHoldings] = useState<LocalHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [showAddHolding, setShowAddHolding] = useState(false);
  const [newHolding, setNewHolding] = useState({ symbol: '', quantity: 0, avgPrice: 0 });

  useEffect(() => {
    loadPortfolios();
    loadLocalHoldings();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      loadPerformance(selectedPortfolio.id);
    }
  }, [selectedPortfolio]);

  useEffect(() => {
    const handleStorageChange = () => {
      loadLocalHoldings();
    };
    window.addEventListener('holdingsUpdated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('holdingsUpdated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadLocalHoldings = () => {
    const saved = localStorage.getItem(LOCAL_HOLDINGS_KEY);
    if (saved) {
      try {
        setLocalHoldings(JSON.parse(saved));
      } catch {
        setLocalHoldings([]);
      }
    }
  };

  const loadPortfolios = async () => {
    try {
      const data = await api.getPortfolios();
      setPortfolios(data);
      if (data.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(data[0]);
      }
    } catch (error: any) {
      console.error('Error loading portfolios:', error);
      // If not authenticated, show empty state
      if (error.response?.status === 401) {
        setPortfolios([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPerformance = async (id: number) => {
    try {
      const data = await api.getPortfolioPerformance(id);
      setPerformance(data);
    } catch (error) {
      console.error('Error loading performance:', error);
    }
  };

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;

    try {
      const portfolio = await api.createPortfolio(newPortfolioName);
      setPortfolios([...portfolios, portfolio]);
      setSelectedPortfolio(portfolio);
      setShowAddModal(false);
      setNewPortfolioName('');
    } catch (error) {
      console.error('Error creating portfolio:', error);
    }
  };

  const handleDeletePortfolio = async (id: number) => {
    if (!confirm('Are you sure you want to delete this portfolio?')) return;

    try {
      await api.deletePortfolio(id);
      setPortfolios(portfolios.filter(p => p.id !== id));
      if (selectedPortfolio?.id === id) {
        setSelectedPortfolio(portfolios[0] || null);
        setPerformance(null);
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error);
    }
  };

  const handleAddHolding = async (e: React.FormEvent) => {
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
  };

  const handleDeleteHolding = async (symbol: string) => {
    const holding = localHoldings.find(h => h.symbol === symbol);
    if (!holding || !confirm(`Sell all ${symbol} from portfolio?`)) return;

    const transactionId = Date.now();
    
    const newTransaction: Transaction = {
      id: transactionId,
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

  const formatCurrency = (num: number | undefined) => {
    if (num === undefined) return 'Rs. 0';
    return `Rs. ${num.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Portfolio</h1>
          <p className="text-text-secondary text-sm">Track your investments</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="button flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Portfolio
          </button>
        </div>
      </div>

      {/* Holdings Summary */}
      {localHoldings.length > 0 && (
        <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
          <div className="text-sm text-text-secondary mb-2">From Transaction History</div>
          <div className="text-2xl font-bold text-text-primary">
            {localHoldings.length} stocks · {formatCurrency(localHoldings.reduce((sum, h) => sum + h.total_cost, 0))} invested
          </div>
        </div>
      )}

      {/* Portfolio Selector */}
      {portfolios.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 items-center">
          {portfolios.map((portfolio) => (
            <div key={portfolio.id} className="flex items-center">
              <button
                onClick={() => setSelectedPortfolio(portfolio)}
                className={`px-4 py-2 rounded text-sm whitespace-nowrap ${
                  selectedPortfolio?.id === portfolio.id
                    ? 'bg-accent text-bg-primary'
                    : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                {portfolio.name}
              </button>
              <button
                onClick={() => handleDeletePortfolio(portfolio.id)}
                className="ml-1 p-1 text-text-secondary hover:text-loss rounded"
                title="Delete portfolio"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {portfolios.length === 0 ? (
        <div className="card text-center py-12">
          <Wallet className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h2 className="text-lg font-medium text-text-primary mb-2">No Portfolios Yet</h2>
          <p className="text-text-secondary mb-4">Add transactions to track your investments</p>
        </div>
      ) : localHoldings.length > 0 ? (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="card">
              <div className="text-text-secondary text-sm">Total Invested</div>
              <div className="text-xl font-bold text-text-primary">
                {formatCurrency(localHoldings.reduce((sum, h) => sum + h.total_cost, 0))}
              </div>
            </div>
            <div className="card">
              <div className="text-text-secondary text-sm">Total Stocks</div>
              <div className="text-xl font-bold text-text-primary">{localHoldings.length}</div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Holdings from Transactions</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-text-secondary text-sm border-b border-border">
                    <th className="text-left py-2">Symbol</th>
                    <th className="text-right py-2">Quantity</th>
                    <th className="text-right py-2">Avg Price</th>
                    <th className="text-right py-2">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {localHoldings.map((holding) => (
                    <tr key={holding.symbol} className="border-b border-border text-sm">
                      <td className="py-3 font-medium text-text-primary">{holding.symbol}</td>
                      <td className="py-3 text-right text-text-primary">{holding.quantity}</td>
                      <td className="py-3 text-right text-text-primary">{formatCurrency(holding.avg_price)}</td>
                      <td className="py-3 text-right text-text-primary">{formatCurrency(holding.total_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : performance && (
        <>
          {/* Performance Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="card">
              <div className="text-text-secondary text-sm">Total Invested</div>
              <div className="text-xl font-bold text-text-primary">
                {formatCurrency(performance.total_invested)}
              </div>
            </div>
            <div className="card">
              <div className="text-text-secondary text-sm">Current Value</div>
              <div className="text-xl font-bold text-text-primary">
                {formatCurrency(performance.current_value)}
              </div>
            </div>
            <div className="card">
              <div className="text-text-secondary text-sm">Profit/Loss</div>
              <div className={`text-xl font-bold ${performance.profit_loss >= 0 ? 'text-gain' : 'text-loss'}`}>
                {performance.profit_loss >= 0 ? '+' : ''}
                {formatCurrency(performance.profit_loss)}
              </div>
            </div>
            <div className="card">
              <div className="text-text-secondary text-sm">Return</div>
              <div className={`text-xl font-bold ${performance.profit_loss_percent >= 0 ? 'text-gain' : 'text-loss'}`}>
                {performance.profit_loss_percent >= 0 ? '+' : ''}
                {performance.profit_loss_percent.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Holdings */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Holdings</h2>
              <button
                onClick={() => setShowAddHolding(true)}
                className="button flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Stock
              </button>
            </div>
            {performance.holdings.length === 0 ? (
              <p className="text-text-secondary text-center py-4">No holdings in this portfolio</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-text-secondary text-sm border-b border-border">
                      <th className="text-left py-2">Symbol</th>
                      <th className="text-right py-2">Quantity</th>
                      <th className="text-right py-2">Avg Price</th>
                      <th className="text-right py-2">Current</th>
                      <th className="text-right py-2">P/L</th>
                      <th className="text-right py-2">P/L %</th>
                      <th className="text-right py-2 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {performance.holdings.map((holding) => (
                      <tr key={holding.symbol} className="border-b border-border text-sm">
                        <td className="py-3 font-medium text-text-primary">{holding.symbol}</td>
                        <td className="py-3 text-right text-text-primary">{holding.quantity}</td>
                        <td className="py-3 text-right text-text-primary">
                          {formatCurrency(holding.avg_price)}
                        </td>
                        <td className="py-3 text-right text-text-primary">
                          {formatCurrency(holding.current_price)}
                        </td>
                        <td className={`py-3 text-right ${(holding.profit_loss || 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                          {(holding.profit_loss || 0) >= 0 ? '+' : ''}
                          {formatCurrency(holding.profit_loss)}
                        </td>
                        <td className={`py-3 text-right ${(holding.profit_loss_percent || 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                          {(holding.profit_loss_percent || 0) >= 0 ? '+' : ''}
                          {holding.profit_loss_percent?.toFixed(2)}%
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteHolding(holding.symbol)}
                            className="text-loss hover:text-loss/70 text-xs flex items-center gap-1 ml-auto"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Delete Portfolio */}
          {selectedPortfolio && (
            <button
              onClick={() => handleDeletePortfolio(selectedPortfolio.id)}
              className="text-loss text-sm hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Delete Portfolio
            </button>
          )}
        </>
      )}

      {/* Add Portfolio Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary border border-border p-6 rounded w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">New Portfolio</h2>
            <form onSubmit={handleCreatePortfolio}>
              <input
                type="text"
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                className="input w-full mb-4"
                placeholder="Portfolio name"
                autoFocus
              />
              <div className="flex gap-2">
                <button type="submit" className="button flex-1">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="button-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Holding Modal */}
      {showAddHolding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary border border-border p-6 rounded w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">Add Stock to Portfolio</h2>
            <form onSubmit={handleAddHolding}>
              <div className="mb-4">
                <label className="block text-text-secondary text-sm mb-2">Stock Symbol</label>
                <StockSelect
                  value={newHolding.symbol}
                  onChange={(symbol) => setNewHolding({ ...newHolding, symbol })}
                  placeholder="Select a stock..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-text-secondary text-sm mb-2">Quantity</label>
                <input
                  type="number"
                  value={newHolding.quantity || ''}
                  onChange={(e) => setNewHolding({ ...newHolding, quantity: parseInt(e.target.value) || 0 })}
                  className="input w-full"
                  placeholder="Number of shares"
                  min="1"
                />
              </div>
              <div className="mb-4">
                <label className="block text-text-secondary text-sm mb-2">Average Price (Rs.)</label>
                <input
                  type="number"
                  value={newHolding.avgPrice || ''}
                  onChange={(e) => setNewHolding({ ...newHolding, avgPrice: parseFloat(e.target.value) || 0 })}
                  className="input w-full"
                  placeholder="Average purchase price"
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="button flex-1">
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddHolding(false)}
                  className="button-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}