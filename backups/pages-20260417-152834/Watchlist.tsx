import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Eye, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import type { StockData } from '../types';
import StockSelect from '../components/StockSelect';

const WATCHLIST_KEY = 'nepse_watchlist';

export default function WatchlistPage() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load all stocks
      const stockData = await api.getStocks();
      setStocks(stockData);

      // Load watchlist from localStorage
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

  const formatPrice = (num: number | undefined) => {
    if (num === undefined) return '-';
    return `Rs. ${num.toFixed(2)}`;
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get stock data for watchlist items
  const watchlistStocks = watchlist
    .map(symbol => stocks.find(s => s.symbol === symbol))
    .filter(Boolean) as StockData[];

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
          <h1 className="text-2xl font-bold text-text-primary">Watchlist</h1>
          <p className="text-text-secondary text-sm">Track stocks without owning</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="button flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Stock
        </button>
      </div>

      {/* Watchlist Table */}
      {watchlistStocks.length === 0 ? (
        <div className="card text-center py-12">
          <Eye className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h2 className="text-lg font-medium text-text-primary mb-2">No Stocks in Watchlist</h2>
          <p className="text-text-secondary mb-4">Add stocks to track their performance</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="button"
          >
            Add Stock
          </button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-text-secondary text-sm border-b border-border">
                <th className="text-left py-3 px-2">Symbol</th>
                <th className="text-right py-3 px-2">Price</th>
                <th className="text-right py-3 px-2">Change</th>
                <th className="text-right py-3 px-2 hidden md:table-cell">Open</th>
                <th className="text-right py-3 px-2 hidden md:table-cell">High</th>
                <th className="text-right py-3 px-2 hidden md:table-cell">Low</th>
                <th className="text-right py-3 px-2">Volume</th>
                <th className="text-right py-3 px-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {watchlistStocks.map((stock) => (
                <tr key={stock.symbol} className="border-b border-border hover:bg-bg-tertiary/50">
                  <td className="py-3 px-2">
                    <div className="font-medium text-text-primary">{stock.symbol}</div>
                    <div className="text-text-secondary text-xs hidden md:block">{stock.name?.slice(0, 30)}</div>
                  </td>
                  <td className="py-3 px-2 text-right font-medium text-text-primary">
                    {formatPrice(stock.last_traded_price)}
                  </td>
                  <td className={`py-3 px-2 text-right ${(stock.percentage_change || 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {(stock.percentage_change || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {stock.percentage_change ? (stock.percentage_change >= 0 ? '+' : '') : ''}{stock.percentage_change?.toFixed(2)}%
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right text-text-secondary hidden md:table-cell">
                    {formatPrice(stock.open_price)}
                  </td>
                  <td className="py-3 px-2 text-right text-text-secondary hidden md:table-cell">
                    {formatPrice(stock.high_price)}
                  </td>
                  <td className="py-3 px-2 text-right text-text-secondary hidden md:table-cell">
                    {formatPrice(stock.low_price)}
                  </td>
                  <td className="py-3 px-2 text-right text-text-secondary">
                    {formatNumber(stock.volume)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => removeFromWatchlist(stock.symbol)}
                      className="text-loss hover:text-loss/70 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary border border-border p-6 rounded w-full max-w-md">
            <h2 className="text-xl font-bold text-text-primary mb-4">Add to Watchlist</h2>
            <div className="mb-4">
              <label className="block text-text-secondary text-sm mb-2">Select Stock</label>
              <StockSelect
                value={selectedSymbol}
                onChange={setSelectedSymbol}
                placeholder="Search and select a stock..."
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={addToWatchlist}
                disabled={!selectedSymbol || watchlist.includes(selectedSymbol)}
                className="button flex-1 disabled:opacity-50"
              >
                Add
              </button>
              <button 
                onClick={() => { setShowAddModal(false); setSelectedSymbol(''); }}
                className="button-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}