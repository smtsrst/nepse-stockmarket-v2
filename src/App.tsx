import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import StockDetail from './pages/StockDetail';

const API_URL = import.meta.env.VITE_API_URL || 'https://frontend-eight-tan-70.vercel.app/api';

export default function App() {
  const [marketOpen, setMarketOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMarket = async () => {
      try {
        const res = await fetch(`${API_URL}/market/status`);
        const data = await res.json();
        setMarketOpen(data.is_open ?? false);
      } catch {
        setMarketOpen(false);
      } finally {
        setLoading(false);
      }
    };
    checkMarket();
    
    // Check every minute
    const interval = setInterval(checkMarket, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar marketOpen={marketOpen} />
        <main className="main-content">
          {!loading && !marketOpen && (
            <div className="market-banner">
              <span>Market is currently closed</span>
            </div>
          )}
          <div className="content-area">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/stocks" element={<Stocks />} />
              <Route path="/stocks/:symbol" element={<StockDetail />} />
              <Route path="/screener" element={<Stocks />} />
              <Route path="/heatmap" element={<Dashboard />} />
              <Route path="/watchlist" element={<Dashboard />} />
              <Route path="/portfolio" element={<Dashboard />} />
              <Route path="/backtest" element={<Dashboard />} />
              <Route path="/dividends" element={<Dashboard />} />
              <Route path="/insights" element={<Dashboard />} />
              <Route path="/ai" element={<Dashboard />} />
              <Route path="/settings" element={<Dashboard />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </div>
        </main>
      </div>
      <style>{`
        .app {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }
        .main-content {
          flex: 1;
          margin-left: 56px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .content-area {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
      `}</style>
    </BrowserRouter>
  );
}
