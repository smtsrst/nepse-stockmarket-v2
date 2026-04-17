import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import StockDetail from './pages/StockDetail';
import Sidebar from './components/Layout/Sidebar';

export default function App() {
  const [marketOpen, setMarketOpen] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    fetch(`${API_URL}/market/status`)
      .then(r => r.json())
      .then(d => setMarketOpen(d.is_open))
      .catch(() => setMarketOpen(false));
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-bg-primary">
        <Sidebar 
          onLogout={() => {}} 
          marketOpen={marketOpen}
          onExpandChange={() => {}} 
        />
        <main className="flex-1 ml-14 transition-all duration-300 p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/stocks/:symbol" element={<StockDetail />} />
            <Route path="/analysis/:symbol" element={<StockDetail />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
