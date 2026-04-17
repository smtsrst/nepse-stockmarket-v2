import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Activity, Brain, BarChart3 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface Stock {
  symbol: string;
  name: string;
  lastTradedPrice: number;
  percentageChange: number;
}

export default function Analysis() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
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
    .slice(0, 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-accent/10 rounded-lg">
          <TrendingUp className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Stock Analysis</h1>
          <p className="text-text-secondary text-xs">Select a stock to view detailed analysis</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-accent mb-2">
            <Activity className="w-5 h-5" />
            <span className="font-medium">Technical Analysis</span>
          </div>
          <p className="text-text-secondary text-sm">
            RSI, MACD, Moving Averages, Bollinger Bands and trend detection
          </p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-accent mb-2">
            <Brain className="w-5 h-5" />
            <span className="font-medium">ML Predictions</span>
          </div>
          <p className="text-text-secondary text-sm">
            Random Forest model predicting next-day price movement
          </p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 text-accent mb-2">
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Price History</span>
          </div>
          <p className="text-text-secondary text-sm">
            Interactive charts with multiple time range options
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          type="text"
          placeholder="Search for a stock symbol or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full pl-10"
        />
      </div>

      {/* Stock List */}
      <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-secondary">Loading stocks...</div>
        ) : (
          <div className="divide-y divide-border">
            {filteredStocks.map((stock) => (
              <div
                key={stock.symbol}
                onClick={() => navigate(`/stocks/${stock.symbol}`)}
                className="flex items-center justify-between p-4 hover:bg-bg-tertiary cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-mono font-semibold text-accent">{stock.symbol}</div>
                  <div className="text-text-secondary text-sm">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-text-primary">Rs. {stock.lastTradedPrice}</div>
                  <div className={`text-sm ${stock.percentageChange >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {stock.percentageChange >= 0 ? '+' : ''}{stock.percentageChange?.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
            {filteredStocks.length === 0 && (
              <div className="p-8 text-center text-text-secondary">
                {search ? 'No stocks found' : 'Loading...'}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-center text-text-secondary text-sm">
        Or browse all stocks from the <span 
          onClick={() => navigate('/stocks')}
          className="text-accent cursor-pointer hover:underline"
        >Stocks page</span>
      </div>
    </div>
  );
}
