import { useState, useEffect } from 'react';
import { RefreshCw, Database, Clock, CheckCircle, AlertCircle, Loader, XCircle, Brain } from 'lucide-react';

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

interface MLStatus {
  running: boolean;
  last_retrain: string | null;
  stats: Record<string, unknown>;
  next_retrain_in_days: number;
}

interface ModelStatus {
  available: boolean;
  trained_at: string;
  path: string;
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
  const [mlStatus, setMlStatus] = useState<MLStatus | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
  const [collecting, setCollecting] = useState(false);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/data/status');
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Backend API not available. Make sure server is running.');
      console.error('Failed to fetch status:', err);
    }
  };

  const fetchMLStatus = async () => {
    try {
      const res = await fetch('/api/predict/scheduler/status');
      if (res.ok) {
        const data = await res.json();
        setMlStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch ML status:', err);
    }
  };

  const fetchModelStatus = async () => {
    try {
      const res = await fetch('/api/predict/status');
      if (res.ok) {
        const data = await res.json();
        setModelStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch model status:', err);
    }
  };

  const fetchDbStats = async () => {
    try {
      const res = await fetch('/api/data/stats');
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      setDbStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchSymbols = async () => {
    try {
      const res = await fetch('/api/data/symbols?limit=50');
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      setSymbols(data.symbols || []);
    } catch (err) {
      console.error('Failed to fetch symbols:', err);
    }
  };

  const triggerCollection = async (full: boolean = false) => {
    setCollecting(true);
    try {
      const res = await fetch('/api/data/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full: full }),
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

  const triggerTraining = async () => {
    setTraining(true);
    try {
      const res = await fetch('/api/predict/train', {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Training failed');
      await fetchModelStatus();
      await fetchMLStatus();
    } catch (err) {
      console.error('Failed to trigger training:', err);
    } finally {
      setTraining(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchMLStatus();
    fetchModelStatus();
    fetchDbStats();
    fetchSymbols();
    
    const interval = setInterval(() => {
      fetchStatus();
      fetchMLStatus();
      fetchModelStatus();
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
      <div className="p-6">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Data Management</h1>
        <div className="p-8 bg-bg-secondary rounded-lg border border-loss/50 text-center">
          <XCircle className="w-12 h-12 text-loss mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Backend Unavailable</h2>
          <p className="text-text-secondary mb-4">{error}</p>
          <p className="text-text-secondary text-sm">
            Start the backend server with: <code className="bg-bg-tertiary px-2 py-1 rounded">python -m uvicorn app.main:app --reload</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Data Management</h1>
        <button
          onClick={() => triggerCollection(false)}
          disabled={collecting}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-bg-primary rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {collecting ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {collecting ? 'Collecting...' : 'Update Now'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-bg-secondary rounded-lg border border-border">
          <div className="flex items-center gap-2 text-text-secondary mb-2">
            <Database className="w-4 h-4" />
            Database Records
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {dbStats?.total_records?.toLocaleString() || status?.db_records?.toLocaleString() || 0}
          </div>
        </div>

        <div className="p-4 bg-bg-secondary rounded-lg border border-border">
          <div className="flex items-center gap-2 text-text-secondary mb-2">
            <CheckCircle className="w-4 h-4" />
            Symbols Tracked
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {dbStats?.unique_symbols || status?.db_symbols || 0}
          </div>
        </div>

        <div className="p-4 bg-bg-secondary rounded-lg border border-border">
          <div className="flex items-center gap-2 text-text-secondary mb-2">
            <Clock className="w-4 h-4" />
            Last Collection
          </div>
          <div className="text-lg font-semibold text-text-primary">
            {formatDate(status?.last_collection || null)}
          </div>
        </div>

        <div className="p-4 bg-bg-secondary rounded-lg border border-border">
          <div className="flex items-center gap-2 text-text-secondary mb-2">
            {mlStatus?.running ? (
              <CheckCircle className="w-4 h-4 text-gain" />
            ) : (
              <AlertCircle className="w-4 h-4 text-loss" />
            )}
            Scheduler Status
          </div>
          <div className={`text-lg font-semibold ${mlStatus?.running ? 'text-gain' : 'text-loss'}`}>
            {mlStatus?.running ? 'Running' : 'Stopped'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-bg-secondary rounded-lg border border-border">
          <div className="flex items-center gap-2 text-text-secondary mb-2">
            <Brain className="w-4 h-4" />
            ML Model Status
          </div>
          <div className={`text-lg font-semibold ${modelStatus?.available ? 'text-gain' : 'text-loss'}`}>
            {modelStatus?.available ? 'Trained' : 'Not Available'}
          </div>
        </div>
        <div className="p-4 bg-bg-secondary rounded-lg border border-border">
          <div className="flex items-center gap-2 text-text-secondary mb-2">
            <Clock className="w-4 h-4" />
            Last Trained
          </div>
          <div className="text-lg font-semibold text-text-primary">
            {modelStatus?.trained_at ? new Date(modelStatus.trained_at).toLocaleString() : 'Never'}
          </div>
        </div>
        <div className="p-4 bg-bg-secondary rounded-lg border border-border">
          <div className="flex items-center gap-2 text-text-secondary mb-2">
            <Clock className="w-4 h-4" />
            Next Auto-Retrain
          </div>
          <div className="text-lg font-semibold text-text-primary">
            {mlStatus?.next_retrain_in_days ?? 7} days
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={triggerTraining}
          disabled={training}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-bg-primary rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {training ? <Loader className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {training ? 'Training...' : 'Retrain ML Model'}
        </button>
      </div>

      {status?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-bg-secondary rounded-lg border border-border">
            <div className="text-text-secondary text-sm">Last Collection Stats</div>
            <div className="text-xl font-bold text-gain">{status.stats.collected} collected</div>
          </div>
          <div className="p-4 bg-bg-secondary rounded-lg border border-border">
            <div className="text-text-secondary text-sm">Failed</div>
            <div className="text-xl font-bold text-loss">{status.stats.failed}</div>
          </div>
          <div className="p-4 bg-bg-secondary rounded-lg border border-border">
            <div className="text-text-secondary text-sm">Duration</div>
            <div className="text-xl font-bold text-text-primary">
              {formatDuration(status.stats.duration_seconds)}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-secondary rounded-lg border border-border overflow-hidden">
          <div className="p-4 bg-bg-tertiary border-b border-border">
            <h2 className="font-semibold text-text-primary">Database Info</h2>
          </div>
          <div className="p-4">
            {dbStats ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total Records:</span>
                  <span className="text-text-primary">{dbStats.total_records.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Unique Symbols:</span>
                  <span className="text-text-primary">{dbStats.unique_symbols}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Date Range:</span>
                  <span className="text-text-primary">{dbStats.date_range}</span>
                </div>
              </div>
            ) : (
              <div className="text-text-secondary">Loading...</div>
            )}
          </div>
        </div>

        <div className="bg-bg-secondary rounded-lg border border-border overflow-hidden">
          <div className="p-4 bg-bg-tertiary border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">Stored Symbols</h2>
            <button
              onClick={() => triggerCollection(true)}
              disabled={collecting}
              className="text-sm px-3 py-1 bg-accent/20 text-accent rounded hover:bg-accent/30 disabled:opacity-50"
            >
              {collecting ? 'Collecting...' : 'Full Collection'}
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-bg-tertiary sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-text-secondary font-medium">Symbol</th>
                  <th className="px-4 py-2 text-right text-text-secondary font-medium">Records</th>
                  <th className="px-4 py-2 text-right text-text-secondary font-medium">Date Range</th>
                </tr>
              </thead>
              <tbody>
                {symbols.map((s) => (
                  <tr key={s.symbol} className="border-t border-border">
                    <td className="px-4 py-2 text-text-primary font-medium">{s.symbol}</td>
                    <td className="px-4 py-2 text-right text-text-secondary">{s.records}</td>
                    <td className="px-4 py-2 text-right text-text-secondary text-sm">
                      {s.from} - {s.to}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {symbols.length === 0 && (
              <div className="p-4 text-center text-text-secondary">
                No data. Click "Update Now" to collect.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}