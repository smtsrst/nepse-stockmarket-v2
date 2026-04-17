import { useState, useEffect } from 'react';
import { RefreshCw, Database, Clock, CheckCircle, AlertCircle, Loader, XCircle, Brain } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

interface DataStatus {
  running: boolean;
  last_collection: string | null;
  stats: {
    collected: number;
    failed: number;
    duration_seconds: number;
  } | null;
  db_records: number;
  db_symbols: number;
}

interface DatabaseStats {
  total_records: number;
  unique_symbols: number;
  date_range: string;
}

interface SymbolInfo {
  symbol: string;
  records: number;
  from: string;
  to: string;
}

export default function DataManagement() {
  const [status, setStatus] = useState<DataStatus | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
  const [collecting, setCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/data/status`);
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Backend API not available. Connect to local backend to manage data.');
    }
  };

  const fetchDbStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/data/stats`);
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      setDbStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchSymbols = async () => {
    try {
      const res = await fetch(`${API_URL}/api/data/symbols?limit=50`);
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      setSymbols(data.symbols || []);
    } catch (err) {
      console.error('Failed to fetch symbols:', err);
    }
  };

  const triggerCollection = async () => {
    setCollecting(true);
    try {
      const res = await fetch(`${API_URL}/api/data/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full: false }),
      });
      if (!res.ok) throw new Error('Collection failed');
      await fetchStatus();
      await fetchDbStats();
    } catch (err) {
      console.error('Failed to trigger collection:', err);
    } finally {
      setCollecting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchDbStats();
    fetchSymbols();
    
    const interval = setInterval(() => {
      fetchStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  if (error) {
    return (
      <div className="data-management">
        <div className="dashboard-header">
          <div className="header-left">
            <h1 className="page-title">DATA MANAGEMENT</h1>
          </div>
        </div>
        <div className="card">
          <div className="empty-state">
            <XCircle size={48} className="text-loss mb-4" />
            <h2 className="text-lg font-medium mb-2">Backend Unavailable</h2>
            <p className="text-muted mb-4">{error}</p>
            <p className="text-muted text-sm">
              Start the backend server with: <code className="code">python -m uvicorn app.main:app --reload</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="data-management">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">DATA MANAGEMENT</h1>
        </div>
        <div className="header-right">
          <button
            onClick={triggerCollection}
            disabled={collecting}
            className="btn btn-primary"
          >
            {collecting ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {collecting ? 'Collecting...' : 'Update Now'}
          </button>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card-icon">
            <Database size={18} />
          </div>
          <div className="summary-card-label">Database Records</div>
          <div className="summary-card-value">
            {dbStats?.total_records?.toLocaleString() || status?.db_records?.toLocaleString() || 0}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-icon">
            <CheckCircle size={18} />
          </div>
          <div className="summary-card-label">Symbols Tracked</div>
          <div className="summary-card-value">
            {dbStats?.unique_symbols || status?.db_symbols || 0}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-icon">
            <Clock size={18} />
          </div>
          <div className="summary-card-label">Last Collection</div>
          <div className="summary-card-value text-sm">
            {formatDate(status?.last_collection || null)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-icon">
            {status?.running ? (
              <CheckCircle size={18} className="text-gain" />
            ) : (
              <AlertCircle size={18} className="text-loss" />
            )}
          </div>
          <div className="summary-card-label">Status</div>
          <div className={`summary-card-value ${status?.running ? 'text-gain' : 'text-loss'}`}>
            {status?.running ? 'Running' : 'Idle'}
          </div>
        </div>
      </div>

      {status?.stats && (
        <div className="summary-grid mt-4 stats-grid">
          <div className="summary-card">
            <div className="summary-card-label">Last Collection Stats</div>
            <div className="summary-card-value text-gain">
              {status.stats.collected} collected
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Failed</div>
            <div className="summary-card-value text-loss">
              {status.stats.failed}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Duration</div>
            <div className="summary-card-value">
              {formatDuration(status.stats.duration_seconds)}
            </div>
          </div>
        </div>
      )}

      <div className="cards-grid mt-4">
        <div className="card">
          <div className="card-header">
            <span className="flex items-center gap-2">
              <Database size={14} />
              DATABASE INFO
            </span>
          </div>
          <div className="card-body">
            {dbStats ? (
              <div className="info-list">
                <div className="info-row">
                  <span className="info-label">Total Records:</span>
                  <span className="info-value">{dbStats.total_records.toLocaleString()}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Unique Symbols:</span>
                  <span className="info-value">{dbStats.unique_symbols}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Date Range:</span>
                  <span className="info-value font-mono">{dbStats.date_range}</span>
                </div>
              </div>
            ) : (
              <div className="loading-container"><div className="loading-spinner"></div></div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="flex items-center gap-2">
              <Brain size={14} />
              ML MODEL
            </span>
          </div>
          <div className="card-body">
            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Status:</span>
                <span className="info-value text-muted">Connect to backend</span>
              </div>
              <div className="info-row">
                <span className="info-label">Retrain:</span>
                <span className="info-value text-muted">Backend required</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <span className="flex items-center gap-2">
            <Database size={14} />
            STORED SYMBOLS
          </span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th style={{ textAlign: 'right' }}>Records</th>
                <th style={{ textAlign: 'right' }}>Date Range</th>
              </tr>
            </thead>
            <tbody>
              {symbols.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: 32 }} className="text-muted">
                    No data. Click "Update Now" to collect.
                  </td>
                </tr>
              ) : symbols.map((s) => (
                <tr key={s.symbol}>
                  <td className="font-mono font-semibold">{s.symbol}</td>
                  <td className="font-mono" style={{ textAlign: 'right' }}>{s.records}</td>
                  <td className="font-mono text-secondary" style={{ textAlign: 'right' }}>
                    {s.from} - {s.to}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .data-management {
          max-width: 1200px;
          margin: 0 auto;
        }

        .stats-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .summary-card-icon {
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .info-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-label {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .info-value {
          font-size: 0.9rem;
        }

        .code {
          padding: 2px 8px;
          background: var(--bg-tertiary);
          border-radius: 3px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
        }

        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
