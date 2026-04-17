import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Search } from 'lucide-react';
import type { FloorsheetData } from '../types';

export default function Floorsheet() {
  const [floorsheet, setFloorsheet] = useState<FloorsheetData[]>([]);
  const [filteredSheet, setFilteredSheet] = useState<FloorsheetData[]>([]);
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFloorsheet();
  }, []);

  useEffect(() => {
    if (symbol) {
      setFilteredSheet(floorsheet.filter(f => f.symbol === symbol.toUpperCase()));
    } else {
      setFilteredSheet(floorsheet);
    }
  }, [symbol, floorsheet]);

  const loadFloorsheet = async () => {
    try {
      const data = await api.getFloorsheet();
      setFloorsheet(data);
      setFilteredSheet(data);
    } catch (error) {
      console.error('Error loading floorsheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return 'N/A';
    return new Intl.NumberFormat('en-NP', { maximumFractionDigits: 0 }).format(num);
  };

  const formatPrice = (num: number | undefined) => {
    if (num === undefined) return 'N/A';
    return `NPR ${num.toFixed(2)}`;
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
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Floorsheet</h1>
        <p className="text-text-secondary text-sm">Broker trading activity</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="input w-full pl-10"
          placeholder="Filter by symbol"
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="text-text-secondary text-sm">Total Transactions</div>
          <div className="text-xl font-bold text-text-primary">{filteredSheet.length}</div>
        </div>
        <div className="card">
          <div className="text-text-secondary text-sm">Total Quantity</div>
          <div className="text-xl font-bold text-text-primary">
            {formatNumber(filteredSheet.reduce((acc, f) => acc + f.quantity, 0))}
          </div>
        </div>
        <div className="card">
          <div className="text-text-secondary text-sm">Total Amount</div>
          <div className="text-xl font-bold text-text-primary">
            NPR {formatNumber(filteredSheet.reduce((acc, f) => acc + f.amount, 0))}
          </div>
        </div>
      </div>

      {/* Floorsheet Table */}
      <div className="card overflow-x-auto">
        {filteredSheet.length === 0 ? (
          <p className="text-text-secondary text-center py-8">No floorsheet data available</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-text-secondary text-sm border-b border-border">
                <th className="text-left py-2">Symbol</th>
                <th className="text-left py-2">Buyer</th>
                <th className="text-left py-2">Seller</th>
                <th className="text-right py-2">Quantity</th>
                <th className="text-right py-2">Rate</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredSheet.slice(0, 50).map((item, index) => (
                <tr key={index} className="border-b border-border text-sm">
                  <td className="py-2 font-medium text-text-primary">{item.symbol}</td>
                  <td className="py-2 text-text-secondary">{item.buyer_broker}</td>
                  <td className="py-2 text-text-secondary">{item.seller_broker}</td>
                  <td className="py-2 text-right text-text-primary">{formatNumber(item.quantity)}</td>
                  <td className="py-2 text-right text-text-primary">{formatPrice(item.rate)}</td>
                  <td className="py-2 text-right text-text-primary">{formatPrice(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filteredSheet.length > 50 && (
          <p className="text-text-secondary text-sm text-center mt-4">
            Showing first 50 of {filteredSheet.length} transactions
          </p>
        )}
      </div>
    </div>
  );
}