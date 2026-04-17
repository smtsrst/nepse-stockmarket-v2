import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Stock {
  symbol: string;
  name: string;
  lastTradedPrice: number;
  percentageChange: number;
  volume: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
}

export default function Stocks() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change'>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'price':
          comparison = a.lastTradedPrice - b.lastTradedPrice;
          break;
        case 'change':
          comparison = a.percentageChange - b.percentageChange;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (column: 'symbol' | 'price' | 'change') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-text-primary">All Stocks</h1>
        <span className="text-text-secondary text-sm">{filteredStocks.length} stocks</span>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by symbol or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full pl-10"
          />
        </div>
      </div>

      {/* Stocks Table */}
      <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-text-secondary text-sm">
                <th 
                  className="p-3 cursor-pointer hover:text-accent"
                  onClick={() => toggleSort('symbol')}
                >
                  Symbol {sortBy === 'symbol' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3">Name</th>
                <th 
                  className="p-3 cursor-pointer hover:text-accent"
                  onClick={() => toggleSort('price')}
                >
                  Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="p-3 cursor-pointer hover:text-accent"
                  onClick={() => toggleSort('change')}
                >
                  Change {sortBy === 'change' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="p-3">Open</th>
                <th className="p-3">High</th>
                <th className="p-3">Low</th>
                <th className="p-3">Volume</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-text-secondary">
                    Loading stocks...
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-text-secondary">
                    No stocks found
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => (
                  <tr 
                    key={stock.symbol} 
                    className="border-b border-border/50 hover:bg-bg-tertiary cursor-pointer"
                    onClick={() => navigate(`/stocks/${stock.symbol}`)}
                  >
                    <td className="p-3 font-mono font-semibold text-accent">{stock.symbol}</td>
                    <td className="p-3 text-text-primary">{stock.name}</td>
                    <td className="p-3 font-semibold text-text-primary">Rs. {stock.lastTradedPrice}</td>
                    <td className={`p-3 font-semibold ${stock.percentageChange >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {stock.percentageChange >= 0 ? '+' : ''}{stock.percentageChange?.toFixed(2)}%
                    </td>
                    <td className="p-3 text-text-secondary">Rs. {stock.openPrice}</td>
                    <td className="p-3 text-text-secondary">Rs. {stock.highPrice}</td>
                    <td className="p-3 text-text-secondary">Rs. {stock.lowPrice}</td>
                    <td className="p-3 text-text-secondary">{stock.volume?.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
