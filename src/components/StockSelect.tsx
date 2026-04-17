import { useState, useEffect } from 'react';
import { api } from '../api/client';
import type { StockData } from '../types';

interface StockSelectProps {
  value: string;
  onChange: (symbol: string) => void;
  placeholder?: string;
}

export default function StockSelect({ value, onChange, placeholder = "Select stock..." }: StockSelectProps) {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    try {
      const data = await api.getStocks();
      setStocks(data);
    } catch (error) {
      console.error('Error loading stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(search.toLowerCase()) ||
    s.name?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50);

  const selectedStock = stocks.find(s => s.symbol === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.stock-select-container')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="relative stock-select-container">
      <div
        className="input flex items-center justify-between cursor-pointer"
        onClick={() => !loading && setIsOpen(!isOpen)}
      >
        <span className={selectedStock ? 'text-text-primary' : 'text-text-secondary'}>
          {selectedStock ? `${selectedStock.symbol} - ${selectedStock.name?.slice(0, 25)}` : placeholder}
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-bg-secondary border border-border rounded shadow-lg">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="input w-full"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredStocks.map((stock) => (
              <div
                key={stock.symbol}
                className={`px-3 py-2 cursor-pointer hover:bg-bg-tertiary ${
                  stock.symbol === value ? 'bg-bg-tertiary text-accent' : 'text-text-primary'
                }`}
                onClick={() => {
                  onChange(stock.symbol);
                  setIsOpen(false);
                  setSearch('');
                }}
              >
                <div className="font-medium">{stock.symbol}</div>
                <div className="text-xs text-text-secondary">{stock.name?.slice(0, 35)}</div>
              </div>
            ))}
            {filteredStocks.length === 0 && (
              <div className="px-3 py-4 text-center text-text-secondary">No stocks found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}