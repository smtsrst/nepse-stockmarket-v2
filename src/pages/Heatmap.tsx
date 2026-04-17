import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PieChart, TrendingUp, TrendingDown } from 'lucide-react';
import type { PortfolioPerformance } from '../types';

interface HeatmapData {
  symbol: string;
  value: number;
  change: number;
  weight: number;
}

export default function HeatmapPage() {
  const [performance, setPerformance] = useState<PortfolioPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<{id: number, name: string}[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);

  useEffect(() => {
    loadPortfolios();
  }, []);

  const loadPortfolios = async () => {
    try {
      const data = await api.getPortfolios();
      setPortfolios(data);
      if (data.length > 0) {
        setSelectedPortfolioId(data[0].id);
        loadPerformance(data[0].id);
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
      setLoading(false);
    }
  };

  const loadPerformance = async (portfolioId: number) => {
    setLoading(true);
    try {
      const data = await api.getPortfolioPerformance(portfolioId);
      setPerformance(data);
    } catch (error) {
      console.error('Error loading performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePortfolioChange = (id: number) => {
    setSelectedPortfolioId(id);
    loadPerformance(id);
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

  // Calculate heatmap data
  const heatmapData: HeatmapData[] = performance?.holdings.map(h => ({
    symbol: h.symbol,
    value: (h.current_price || 0) * (h.quantity || 0),
    change: h.profit_loss_percent || 0,
    weight: 0, // Will calculate below
  })) || [];

  // Calculate weights
  const totalValue = heatmapData.reduce((acc, h) => acc + h.value, 0);
  heatmapData.forEach(h => {
    h.weight = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
  });

  // Sort by value
  heatmapData.sort((a, b) => b.value - a.value);

  // Get color based on change percentage
  const getColor = (change: number) => {
    const maxChange = 5;
    const normalized = Math.max(-maxChange, Math.min(maxChange, change)) / maxChange;
    
    if (normalized >= 0) {
      // Green with varying intensity
      const intensity = Math.round(normalized * 255);
      return `rgb(34, 197, ${94 + (255 - intensity)})`;
    } else {
      // Red with varying intensity
      const intensity = Math.round(Math.abs(normalized) * 255);
      return `rgb(${239 - intensity}, 68, 68)`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Portfolio Heatmap</h1>
          <p className="text-text-secondary text-sm">Visualize your holdings by value and performance</p>
        </div>
      </div>

      {/* Portfolio Selector */}
      {portfolios.length > 1 && (
        <div className="flex gap-2">
          {portfolios.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePortfolioChange(p.id)}
              className={`px-4 py-2 rounded text-sm ${
                selectedPortfolioId === p.id
                  ? 'bg-accent text-bg-primary'
                  : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {!performance || performance.holdings.length === 0 ? (
        <div className="card text-center py-12">
          <PieChart className="w-12 h-12 text-text-secondary mx-auto mb-4" />
          <h2 className="text-lg font-medium text-text-primary mb-2">No Holdings</h2>
          <p className="text-text-secondary">Add stocks to your portfolio to see the heatmap</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="card">
              <div className="text-text-secondary text-sm">Total Value</div>
              <div className="text-xl font-bold text-text-primary">
                {formatCurrency(performance.current_value)}
              </div>
            </div>
            <div className="card">
              <div className="text-text-secondary text-sm">Today's P/L</div>
              <div className={`text-xl font-bold ${performance.profit_loss >= 0 ? 'text-gain' : 'text-loss'}`}>
                {performance.profit_loss >= 0 ? '+' : ''}{formatCurrency(performance.profit_loss)}
              </div>
            </div>
            <div className="card">
              <div className="text-text-secondary text-sm">Total P/L</div>
              <div className={`text-xl font-bold ${performance.profit_loss_percent >= 0 ? 'text-gain' : 'text-loss'}`}>
                {performance.profit_loss_percent >= 0 ? '+' : ''}{performance.profit_loss_percent.toFixed(2)}%
              </div>
            </div>
            <div className="card">
              <div className="text-text-secondary text-sm">Holdings</div>
              <div className="text-xl font-bold text-text-primary">
                {performance.holdings.length}
              </div>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Holdings Heatmap</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {heatmapData.map((holding) => (
                <div
                  key={holding.symbol}
                  className="p-4 rounded cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: getColor(holding.change) }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-white text-shadow">{holding.symbol}</span>
                    <span className={`text-xs ${holding.change >= 0 ? 'text-white' : 'text-white/80'}`}>
                      {holding.change >= 0 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                      {holding.change >= 0 ? '+' : ''}{holding.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-white/90 text-sm">
                    {formatCurrency(holding.value)}
                  </div>
                  <div className="text-white/70 text-xs">
                    {holding.weight.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="card">
            <h3 className="text-text-secondary text-sm mb-3">Legend</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(34, 197, 94)' }} />
                <span className="text-text-secondary text-xs">+5%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(34, 197, 150)' }} />
                <span className="text-text-secondary text-xs">+2.5%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(200, 200, 200)' }} />
                <span className="text-text-secondary text-xs">0%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(239, 100, 100)' }} />
                <span className="text-text-secondary text-xs">-2.5%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgb(239, 68, 68)' }} />
                <span className="text-text-secondary text-xs">-5%</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}