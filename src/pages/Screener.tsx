import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { TrendingUp, TrendingDown, Search } from 'lucide-react';
import type { StockData } from '../types';

type ScreenerPreset = 'gainers' | 'losers' | 'active' | 'volume' | 'turnover';

const presets: { id: ScreenerPreset; label: string; description: string }[] = [
  { id: 'gainers', label: 'Top Gainers', description: 'Stocks with highest daily gain' },
  { id: 'losers', label: 'Top Losers', description: 'Stocks with highest daily loss' },
  { id: 'active', label: 'Most Active', description: 'Stocks with most trades today' },
  { id: 'volume', label: 'Highest Volume', description: 'Stocks with highest traded shares' },
  { id: 'turnover', label: 'Highest Turnover', description: 'Stocks with highest trading value' },
];

export default function ScreenerPage() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<ScreenerPreset>('gainers');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadStocks();
  }, [preset]);

const loadStocks = async () => {
    setLoading(true);
    try {
      const data = await api.getStocks();
      setStocks(data);
    } catch (error) {
      console.error('Error loading stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredStocks = () => {
    let filtered = [...stocks];

    // Apply preset filter
    switch (preset) {
      case 'gainers':
        // Sort descending (highest positive first)
        filtered = filtered.sort((a, b) => {
          const aChange = a.percentage_change || 0;
          const bChange = b.percentage_change || 0;
          return bChange - aChange;
        });
        // Only show positive changes
        filtered = filtered.filter(s => (s.percentage_change || 0) > 0);
        break;
      case 'losers':
        // Sort ascending (lowest/negative first)
        filtered = filtered.sort((a, b) => {
          const aChange = a.percentage_change || 0;
          const bChange = b.percentage_change || 0;
          return aChange - bChange;
        });
        // Only show negative changes
        filtered = filtered.filter(s => (s.percentage_change || 0) < 0);
        break;
      case 'active':
        // Stocks with highest % change (positive)
        filtered = filtered.sort((a, b) => (b.percentage_change || 0) - (a.percentage_change || 0));
        filtered = filtered.filter(s => (s.percentage_change || 0) > 0);
        break;
      case 'volume':
        // Highest volume
        filtered = filtered.sort((a, b) => (b.volume || 0) - (a.volume || 0));
        break;
      case 'turnover':
        // Highest turnover = price * volume
        filtered = filtered.sort((a, b) => {
          const aTurnover = (a.last_traded_price || 0) * (a.volume || 0);
          const bTurnover = (b.last_traded_price || 0) * (b.volume || 0);
          return bTurnover - aTurnover;
        });
        break;
    }

    // Apply search filter
    if (search) {
      filtered = filtered.filter(s => 
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered.slice(0, 50);
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

  const filteredStocks = getFilteredStocks();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Stock Screener</h1>
          <p className="text-text-secondary text-sm">Find stocks by predefined criteria</p>
        </div>
      </div>

      {/* Preset Filters */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id)}
            className={`px-4 py-2 rounded text-sm transition-colors ${
              preset === p.id
                ? 'bg-accent text-bg-primary font-medium'
                : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full pl-10"
          placeholder="Search by symbol or name..."
        />
      </div>

      {/* Results Info */}
      <div className="text-text-secondary text-sm">
        Showing {filteredStocks.length} stocks
      </div>

      {/* Stock Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">Loading...</div>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-text-secondary text-sm border-b border-border">
                <th className="text-left py-3 px-2">Rank</th>
                <th className="text-left py-3 px-2">Symbol</th>
                <th className="text-right py-3 px-2">Price</th>
                <th className="text-right py-3 px-2">Change</th>
                <th className="text-right py-3 px-2 hidden md:table-cell">Open</th>
                <th className="text-right py-3 px-2 hidden md:table-cell">High</th>
                <th className="text-right py-3 px-2 hidden md:table-cell">Low</th>
                <th className="text-right py-3 px-2">Volume</th>
                <th className="text-right py-3 px-2 hidden lg:table-cell">Turnover</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock, index) => (
                <tr key={stock.symbol} className="border-b border-border hover:bg-bg-tertiary/50">
                  <td className="py-3 px-2 text-text-secondary text-sm">{index + 1}</td>
                  <td className="py-3 px-2">
                    <div className="font-medium text-text-primary">{stock.symbol}</div>
                    <div className="text-text-secondary text-xs hidden md:block">{stock.name?.slice(0, 25)}</div>
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
                  <td className="py-3 px-2 text-right text-text-secondary hidden lg:table-cell">
                    Rs. {formatNumber((stock.last_traded_price || 0) * (stock.volume || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}