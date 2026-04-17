import { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUpDown, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import StockSelect from '../components/StockSelect';

const TRANSACTIONS_KEY = 'nepse_transactions';
const HOLDINGS_KEY = 'nepse_holdings';

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

const loadStoredTransactions = (): Transaction[] => {
  const saved = localStorage.getItem(TRANSACTIONS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed.sort((a: Transaction, b: Transaction) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch {
      return [];
    }
  }
  return [];
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(loadStoredTransactions);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    type: 'BUY' as 'BUY' | 'SELL',
    quantity: '',
    rate: '',
    notes: '',
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setTransactions(loadStoredTransactions());
    };
    window.addEventListener('holdingsUpdated', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('holdingsUpdated', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Transaction History</h1>
          <p className="text-text-secondary text-sm mt-1">
            Record your trades here - Portfolio will update automatically
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-bg-primary rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-bg-secondary rounded-lg border border-border">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-1">
              <StockSelect
                value={formData.symbol}
                onChange={(symbol) => setFormData({ ...formData, symbol })}
                placeholder="Select stock..."
              />
            </div>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'BUY' | 'SELL' })}
              className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary"
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
            <input
              type="number"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder-text-secondary"
              required
            />
            <input
              type="number"
              placeholder="Rate (Rs.)"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder-text-secondary"
              required
            />
            <input
              type="text"
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder-text-secondary"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gain text-white rounded-lg hover:bg-gain/90 transition-colors"
            >
              Save
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-bg-secondary rounded-lg border border-border">
          <div className="flex items-center gap-2 text-text-secondary mb-1">
            <TrendingUp className="w-4 h-4" />
            Total Buys
          </div>
          <div className="text-xl font-bold text-loss">{formatCurrency(totalBuy)}</div>
        </div>
        <div className="p-4 bg-bg-secondary rounded-lg border border-border">
          <div className="flex items-center gap-2 text-text-secondary mb-1">
            <TrendingDown className="w-4 h-4" />
            Total Sells
          </div>
          <div className="text-xl font-bold text-gain">{formatCurrency(totalSell)}</div>
        </div>
        <div className="p-4 bg-bg-secondary rounded-lg border border-border">
          <div className="flex items-center gap-2 text-text-secondary mb-1">
            <ArrowUpDown className="w-4 h-4" />
            Net Investment
          </div>
          <div className={`text-xl font-bold ${netInvestment >= 0 ? 'text-loss' : 'text-gain'}`}>
            {formatCurrency(netInvestment)}
          </div>
        </div>
      </div>

      <div className="bg-bg-secondary rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg-tertiary">
            <tr>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Date</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Symbol</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Type</th>
              <th className="px-4 py-3 text-right text-text-secondary font-medium">Qty</th>
              <th className="px-4 py-3 text-right text-text-secondary font-medium">Rate</th>
              <th className="px-4 py-3 text-right text-text-secondary font-medium">Amount</th>
              <th className="px-4 py-3 text-center text-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <div className="flex flex-col items-center text-text-secondary">
                    <FileText className="w-8 h-8 mb-2 opacity-50" />
                    <p>No transactions yet.</p>
                    <p className="text-sm mt-1">Add your first buy/sell transaction above.</p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-bg-tertiary/50">
                  <td className="px-4 py-3 text-text-primary">{t.date}</td>
                  <td className="px-4 py-3 text-text-primary font-medium">{t.symbol}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        t.type === 'BUY' ? 'bg-loss/20 text-loss' : 'bg-gain/20 text-gain'
                      }`}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary">{t.quantity}</td>
                  <td className="px-4 py-3 text-right text-text-primary">Rs. {t.rate.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-text-primary">{formatCurrency(t.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => deleteTransaction(t.id)}
                      className="p-1 text-text-secondary hover:text-loss transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}