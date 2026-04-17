import { RefreshCw, Clock, Info } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary text-sm">Configure your dashboard</p>
      </div>

      {/* Data Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Data Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm mb-2">
              Auto-refresh interval
            </label>
            <select className="input w-full">
              <option value="30">Every 30 seconds</option>
              <option value="60">Every 1 minute</option>
              <option value="300">Every 5 minutes</option>
            </select>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Info className="w-5 h-5" />
          About
        </h2>
        <div className="space-y-2 text-text-secondary">
          <p><strong className="text-text-primary">NEPSE Stock Dashboard V2</strong></p>
          <p>Version: 1.0.0</p>
          <p>Built with React + FastAPI</p>
          <p>Data source: NEPSE Official API</p>
        </div>
      </div>

      {/* Trading Hours */}
      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Trading Hours
        </h2>
        <p className="text-text-secondary">
          NEPSE market is open Sunday to Friday, 11:00 AM - 3:00 PM Nepal Time.
        </p>
        <p className="text-text-secondary text-sm mt-2">
          (Closed on Saturdays and public holidays)
        </p>
      </div>
    </div>
  );
}