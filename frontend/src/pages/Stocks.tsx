import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Search, ArrowUpDown, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import type { StockData } from '../types';

export default function Stocks() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'symbol' | 'last_traded_price' | 'percentage_change' | 'volume'>('last_traded_price');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [sectorFilter, setSectorFilter] = useState<string>('');
  // setSectors is used in loadStocks but result is not displayed
  const [, setSectors] = useState<string[]>([]);

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      const data = await api.getStocks();
      setStocks(data);
      
      // Extract unique sectors
      const uniqueSectors = [...new Set(data.map(s => s.name?.split(' ').slice(-1)[0]).filter((s): s is string => Boolean(s)))];
      setSectors(uniqueSectors.slice(0, 20));
    } catch (error) {
      console.error('Error loading stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filteredStocks = stocks
    .filter(s => {
      const matchSearch = !search || 
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.name?.toLowerCase().includes(search.toLowerCase());
      
      // Sector filter - match based on name keywords
      const matchSector = !sectorFilter || (
        (sectorFilter === 'Bank' && s.name?.toLowerCase().includes('bank')) ||
        (sectorFilter === 'Finance' && (s.name?.toLowerCase().includes('finance') || s.name?.toLowerCase().includes('development bank'))) ||
        (sectorFilter === 'Hydropower' && s.name?.toLowerCase().includes('hydropower')) ||
        (sectorFilter === 'Insurance' && s.name?.toLowerCase().includes('insurance')) ||
        (sectorFilter === 'Microfinance' && s.name?.toLowerCase().includes('microfinance')) ||
        (sectorFilter === 'Manufacturing' && (s.name?.toLowerCase().includes('manufacturing') || s.name?.toLowerCase().includes('industry'))) ||
        (sectorFilter === 'Hotel' && s.name?.toLowerCase().includes('hotel')) ||
        (sectorFilter === 'Mutual' && (s.name?.toLowerCase().includes('mutual') || s.name?.toLowerCase().includes('scheme'))) ||
        (sectorFilter === 'Trading' && s.name?.toLowerCase().includes('trading')) ||
        (sectorFilter === 'Others' && !s.name?.toLowerCase().match(/bank|finance|hydropower|insurance|microfinance|manufacturing|hotel|mutual|trading/))
      );
      
      return matchSearch && matchSector;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return new Intl.NumberFormat('en-NP').format(num);
  };

  const formatPrice = (num: number | undefined) => {
    if (num === undefined) return '-';
    return `Rs. ${num.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-secondary">Loading stocks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Stock Market</h1>
          <p className="text-text-secondary text-sm">Browse all listed companies</p>
        </div>
        <div className="text-text-secondary text-sm">
          {filteredStocks.length} stocks
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full pl-10"
            placeholder="Search by symbol or name..."
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-secondary" />
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="input"
          >
            <option value="">All Sectors</option>
            <option value="Bank">Banks</option>
            <option value="Finance">Finance</option>
            <option value="Hydropower">Hydropower</option>
            <option value="Insurance">Insurance</option>
            <option value="Microfinance">Microfinance</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Hotel">Hotels</option>
            <option value="Mutual">Mutual Fund</option>
            <option value="Trading">Trading</option>
            <option value="Others">Others</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="text-text-secondary text-sm">Market Cap</div>
          <div className="text-lg font-bold text-text-primary">
            Rs. {formatNumber(stocks.reduce((acc, s) => acc + (s.last_traded_price || 0) * 100000, 0))}
          </div>
        </div>
        <div className="card">
          <div className="text-text-secondary text-sm">Gainers</div>
          <div className="text-lg font-bold text-gain">
            {stocks.filter(s => (s.percentage_change || 0) > 0).length}
          </div>
        </div>
        <div className="card">
          <div className="text-text-secondary text-sm">Losers</div>
          <div className="text-lg font-bold text-loss">
            {stocks.filter(s => (s.percentage_change || 0) < 0).length}
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-text-secondary text-sm border-b border-border">
              <th className="text-left py-3 px-2">Symbol</th>
              <th className="text-right py-3 px-2 cursor-pointer hover:text-text-primary" onClick={() => handleSort('last_traded_price')}>
                <div className="flex items-center justify-end gap-1">
                  Price
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="text-right py-3 px-2 cursor-pointer hover:text-text-primary" onClick={() => handleSort('percentage_change')}>
                <div className="flex items-center justify-end gap-1">
                  Change
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="text-right py-3 px-2 hidden md:table-cell">Open</th>
              <th className="text-right py-3 px-2 hidden md:table-cell">Prev Close</th>
              <th className="text-right py-3 px-2 cursor-pointer hover:text-text-primary" onClick={() => handleSort('volume')}>
                <div className="flex items-center justify-end gap-1">
                  Volume
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.slice(0, 50).map((stock) => (
              <tr key={stock.symbol} className="table-row">
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
                  {formatPrice(stock.open_price)}
                </td>
                <td className="py-3 px-2 text-right text-text-secondary">
                  {formatNumber(stock.volume)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStocks.length === 0 && (
          <p className="text-text-secondary text-center py-8">No stocks found</p>
        )}
      </div>

      {filteredStocks.length > 50 && (
        <p className="text-text-secondary text-sm text-center">
          Showing first 50 of {filteredStocks.length} stocks
        </p>
      )}
    </div>
  );
}