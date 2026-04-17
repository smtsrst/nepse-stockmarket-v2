import { RefreshCw, Clock, Info, Database, Zap, Shield } from 'lucide-react';

const REFRESH_KEY = 'nepse_refresh_interval';

export default function Settings() {
  const handleRefreshChange = (value: string) => {
    localStorage.setItem(REFRESH_KEY, value);
  };

  return (
    <div className="settings">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">SETTINGS</h1>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card">
          <div className="card-header">
            <span className="flex items-center gap-2">
              <RefreshCw size={14} />
              DATA SETTINGS
            </span>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Auto-refresh Interval</label>
              <select 
                className="form-select" 
                defaultValue={localStorage.getItem(REFRESH_KEY) || '30'}
                onChange={(e) => handleRefreshChange(e.target.value)}
              >
                <option value="15">Every 15 seconds</option>
                <option value="30">Every 30 seconds</option>
                <option value="60">Every 1 minute</option>
                <option value="300">Every 5 minutes</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="flex items-center gap-2">
              <Clock size={14} />
              TRADING HOURS
            </span>
          </div>
          <div className="card-body">
            <div className="info-block">
              <p className="info-label">Market Hours</p>
              <p className="info-value">Sunday to Friday, 11:00 AM - 3:00 PM NPT</p>
            </div>
            <div className="info-block">
              <p className="info-label">Weekend</p>
              <p className="info-value">Closed on Saturdays</p>
            </div>
            <div className="info-block">
              <p className="info-label">Holidays</p>
              <p className="info-value">Closed on public holidays (NEPSE calendar)</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="flex items-center gap-2">
              <Zap size={14} />
              FEATURES
            </span>
          </div>
          <div className="card-body">
            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-status active">Active</span>
                <span className="feature-name">Live Market Data</span>
              </div>
              <div className="feature-item">
                <span className="feature-status active">Active</span>
                <span className="feature-name">Technical Analysis</span>
              </div>
              <div className="feature-item">
                <span className="feature-status active">Active</span>
                <span className="feature-name">ML Price Predictions</span>
              </div>
              <div className="feature-item">
                <span className="feature-status active">Active</span>
                <span className="feature-name">Historical Data</span>
              </div>
              <div className="feature-item">
                <span className="feature-status active">Active</span>
                <span className="feature-name">Watchlist</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="flex items-center gap-2">
              <Shield size={14} />
              DATA SOURCES
            </span>
          </div>
          <div className="card-body">
            <div className="info-block">
              <p className="info-label">Live Data</p>
              <p className="info-value font-mono">YONEPSE API</p>
            </div>
            <div className="info-block">
              <p className="info-label">Historical Data</p>
              <p className="info-value font-mono">Neon PostgreSQL</p>
            </div>
            <div className="info-block">
              <p className="info-label">ML Predictions</p>
              <p className="info-value font-mono">Scikit-learn (RandomForest)</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="flex items-center gap-2">
              <Info size={14} />
              ABOUT
            </span>
          </div>
          <div className="card-body">
            <div className="about-content">
              <div className="about-logo">NEPSE</div>
              <div className="about-title">Stock Dashboard V2</div>
              <div className="about-version">Version 2.0.0</div>
              <div className="about-tech">
                <span>React</span>
                <span>TypeScript</span>
                <span>Vite</span>
                <span>Vercel</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .settings {
          max-width: 1200px;
          margin: 0 auto;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
        }

        .form-group {
          margin-bottom: 12px;
        }

        .form-label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-select {
          width: 100%;
          padding: 10px 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          cursor: pointer;
        }

        .form-select:focus {
          outline: none;
          border-color: var(--accent);
        }

        .info-block {
          margin-bottom: 12px;
        }

        .info-block:last-child {
          margin-bottom: 0;
        }

        .info-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .info-value {
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .feature-status {
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 3px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .feature-status.active {
          background: rgba(0, 200, 83, 0.15);
          color: #00c853;
        }

        .feature-name {
          font-size: 0.85rem;
        }

        .about-content {
          text-align: center;
          padding: 16px 0;
        }

        .about-logo {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--accent);
          margin-bottom: 8px;
        }

        .about-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .about-version {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 16px;
        }

        .about-tech {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .about-tech span {
          font-size: 0.7rem;
          padding: 4px 8px;
          background: var(--bg-tertiary);
          border-radius: 3px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
