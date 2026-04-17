import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from './api/client';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import Analysis from './pages/Analysis';
import Portfolio from './pages/Portfolio';
import Floorsheet from './pages/Floorsheet';
import Watchlist from './pages/Watchlist';
import Screener from './pages/Screener';
import Settings from './pages/Settings';
import Transactions from './pages/Transactions';
import Alerts from './pages/Alerts';
import Backtesting from './pages/Backtesting';
import DataManagement from './pages/DataManagement';
import Sidebar from './components/Layout/Sidebar';

function App() {
  const [marketOpen, setMarketOpen] = useState(false);

  useEffect(() => {
    api.getMarketStatus()
      .then(status => setMarketOpen(status.is_open))
      .catch(() => setMarketOpen(false));
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-bg-primary">
        <Sidebar 
          onLogout={() => {}} 
          marketOpen={marketOpen} 
          onExpandChange={(expanded) => {
            const main = document.querySelector('main');
            if (main) {
              main.style.marginLeft = expanded ? '224px' : '56px';
            }
          }} 
        />
        <main className="flex-1 ml-14 transition-all duration-300 p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/screener" element={<Screener />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/floorsheet" element={<Floorsheet />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/backtesting" element={<Backtesting />} />
            <Route path="/data" element={<DataManagement />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;