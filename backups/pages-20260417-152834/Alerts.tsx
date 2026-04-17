import { useState, useEffect } from 'react';
import { Plus, Trash2, Bell, BellOff } from 'lucide-react';
import { PriceAlert } from '../types';
import StockSelect from '../components/StockSelect';

const STORAGE_KEY = 'nepse_price_alerts';

export default function Alerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    target_price: '',
    condition: 'ABOVE' as 'ABOVE' | 'BELOW',
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setAlerts(JSON.parse(saved));
      } catch {
        setAlerts([]);
      }
    }
  }, []);

  const saveAlerts = (data: PriceAlert[]) => {
    setAlerts(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert: PriceAlert = {
      id: Date.now(),
      symbol: formData.symbol,
      target_price: parseFloat(formData.target_price),
      condition: formData.condition,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    saveAlerts([...alerts, newAlert]);
    setFormData({ symbol: '', target_price: '', condition: 'ABOVE' });
    setShowForm(false);
  };

  const toggleAlert = (id: number) => {
    saveAlerts(alerts.map((a) => (a.id === id ? { ...a, is_active: !a.is_active } : a)));
  };

  const deleteAlert = (id: number) => {
    if (confirm('Delete this alert?')) {
      saveAlerts(alerts.filter((a) => a.id !== id));
    }
  };

  const activeCount = alerts.filter((a) => a.is_active).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Price Alerts</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-bg-primary rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Alert
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-bg-secondary rounded-lg border border-border">
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-text-secondary text-sm mb-1">Stock</label>
              <StockSelect
                value={formData.symbol}
                onChange={(symbol) => setFormData({ ...formData, symbol })}
                placeholder="Select stock..."
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-text-secondary text-sm mb-1">Target Price (Rs.)</label>
              <input
                type="number"
                placeholder="0.00"
                value={formData.target_price}
                onChange={(e) => setFormData({ ...formData, target_price: e.target.value })}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder-text-secondary"
                required
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-text-secondary text-sm mb-1">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as 'ABOVE' | 'BELOW' })}
                className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary"
              >
                <option value="ABOVE">Price Above</option>
                <option value="BELOW">Price Below</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-gain text-white rounded-lg hover:bg-gain/90 transition-colors"
            >
              Save
            </button>
          </form>
        </div>
      )}

      <div className="mb-6 p-4 bg-bg-secondary rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-accent" />
          <span className="text-text-primary">
            <span className="font-bold">{activeCount}</span> active alert{activeCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="bg-bg-secondary rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg-tertiary">
            <tr>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Symbol</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Target Price</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Condition</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Status</th>
              <th className="px-4 py-3 text-left text-text-secondary font-medium">Created</th>
              <th className="px-4 py-3 text-center text-text-secondary font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                  No alerts set. Create your first alert above.
                </td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.id} className="border-t border-border hover:bg-bg-tertiary/50">
                  <td className="px-4 py-3 text-text-primary font-medium">{alert.symbol}</td>
                  <td className="px-4 py-3 text-text-primary">Rs. {alert.target_price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-text-primary">
                    {alert.condition === 'ABOVE' ? 'Above' : 'Below'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        alert.is_active ? 'bg-gain/20 text-gain' : 'bg-text-secondary/20 text-text-secondary'
                      }`}
                    >
                      {alert.is_active ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm">
                    {new Date(alert.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => toggleAlert(alert.id)}
                        className="p-1 text-text-secondary hover:text-accent transition-colors"
                        title={alert.is_active ? 'Pause' : 'Activate'}
                      >
                        {alert.is_active ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="p-1 text-text-secondary hover:text-loss transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}