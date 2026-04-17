import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

export default function Dashboard() {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://nepse-backend-jv9v.onrender.com/api/stocks?limit=20')
      .then(r => r.json())
      .then(d => {
        setStocks(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">NEPSE Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-bg-secondary p-4 rounded-lg border border-border">
          <div className="text-text-secondary text-sm">Market Status</div>
          <div className="text-xl font-bold text-gain">Open</div>
        </div>
        <div className="bg-bg-secondary p-4 rounded-lg border border-border">
          <div className="text-text-secondary text-sm">Total Stocks</div>
          <div className="text-xl font-bold">{stocks.length}</div>
        </div>
        <div className="bg-bg-secondary p-4 rounded-lg border border-border">
          <div className="text-text-secondary text-sm">Top Gainer</div>
          <div className="text-xl font-bold text-gain">
            {stocks[0]?.symbol || 'N/A'}
          </div>
        </div>
      </div>

      <div className="bg-bg-secondary p-4 rounded-lg border border-border">
        <h2 className="text-lg font-bold mb-4">Top Stocks</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-text-secondary">
                <th className="pb-2">Symbol</th>
                <th className="pb-2">Name</th>
                <th className="pb-2">Price</th>
                <th className="pb-2">Change</th>
              </tr>
            </thead>
            <tbody>
              {stocks.slice(0, 10).map((stock) => (
                <tr key={stock.symbol} className="border-t border-border">
                  <td className="py-2 font-mono">{stock.symbol}</td>
                  <td className="py-2">{stock.name}</td>
                  <td className="py-2">Rs. {stock.lastTradedPrice}</td>
                  <td className={`py-2 ${stock.percentageChange >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {stock.percentageChange?.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
