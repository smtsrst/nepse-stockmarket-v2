import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import StockDetail from './pages/StockDetail';
import Screener from './pages/Screener';
import Heatmap from './pages/Heatmap';
import Watchlist from './pages/Watchlist';
import Portfolio from './pages/Portfolio';
import Backtesting from './pages/Backtesting';
import Settings from './pages/Settings';
import Analysis from './pages/Analysis';
import Transactions from './pages/Transactions';
import Alerts from './pages/Alerts';
import Floorsheet from './pages/Floorsheet';
import DataManagement from './pages/DataManagement';
import Login from './pages/Login';

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
              <Route path="/screener" element={<Screener />} />
              <Route path="/heatmap" element={<Heatmap />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/backtest" element={<Backtesting />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/floorsheet" element={<Floorsheet />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/data" element={<DataManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/login" element={<Login />} />
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
