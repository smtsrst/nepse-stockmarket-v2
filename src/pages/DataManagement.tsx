import { useState, useEffect } from 'react';
import { RefreshCw, Database, Clock, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://frontend-eight-tan-70.vercel.app/api';

interface DatabaseStats {
  stock_count: number;
  price_count: number;
  date_range: string;
  last_collection: string | null;
  last_records: number;
  last_status: string | null;
}

export default function DataManagement() {
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symbols, setSymbols] = useState<
    { symbol: string; records: number; first_date: string; last_date: string }[]
  >([]);

  const fetchStats = async () => {
    try {
      // Get all stocks and count prices per symbol
      const stocksRes = await fetch(`${API_URL}/stocks`);
      const stocks = await stocksRes.json();

      const symbolStats: {
        symbol: string;
        records: number;
        first_date: string;
        last_date: string;
      }[] = [];

      // Sample a few stocks to get stats (don't fetch all for performance)
      const sampleSymbols = Array.isArray(stocks) ? stocks.slice(0, 50) : [];

      let totalRecords = 0;
      let minDate = '';
      let maxDate = '';

      for (const stock of sampleSymbols) {
        try {
          const historyRes = await fetch(`${API_URL}/history?symbol=${stock.symbol}&days=1000`);
          const historyData = await historyRes.json();

          if (
            historyData.history &&
            Array.isArray(historyData.history) &&
            historyData.history.length > 0
          ) {
            const records = historyData.history.length;
            totalRecords += records;

            if (!minDate || historyData.history[historyData.history.length - 1].date < minDate) {
              minDate = historyData.history[historyData.history.length - 1].date;
            }
            if (!maxDate || historyData.history[0].date > maxDate) {
              maxDate = historyData.history[0].date;
            }

            symbolStats.push({
              symbol: stock.symbol,
              records,
              first_date: historyData.history[historyData.history.length - 1].date,
              last_date: historyData.history[0].date,
            });
          }
        } catch (e) {
          // Skip errors for individual symbols
        }
      }

      // Estimate total based on sample
      const sampleRatio = Array.isArray(stocks) ? stocks.length / sampleSymbols.length : 1;
      const estimatedTotal = Math.round(totalRecords * sampleRatio);

      setDbStats({
        stock_count: Array.isArray(stocks) ? stocks.length : 0,
        price_count: estimatedTotal,
        date_range: minDate && maxDate ? `${minDate} to ${maxDate}` : 'No data',
        last_collection: null,
        last_records: totalRecords,
        last_status: 'ok',
      });

      setSymbols(symbolStats.sort((a, b) => b.records - a.records));
      setError(null);
    } catch (err) {
      setError('Failed to fetch database stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="data-management">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">DATA MANAGEMENT</h1>
        </div>
        <div className="header-right">
          <button onClick={fetchStats} disabled={loading} className="btn btn-ghost">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <div className="info-box">
            <AlertCircle size={18} className="text-accent" />
            <div>
              <p className="font-medium mb-1">GitHub Actions Data Collection</p>
              <p className="text-sm text-secondary">
                Data is automatically collected every 30 minutes during market hours via GitHub
                Actions. Historical data backfill runs on the first deployment.
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <span className="mt-2">Loading database stats...</span>
          </div>
        </div>
      ) : error ? (
        <div className="card">
          <div className="empty-state">
            <AlertCircle size={48} className="text-loss mb-4" />
            <h2 className="text-lg font-medium mb-2">Error Loading Stats</h2>
            <p className="text-muted mb-4">{error}</p>
            <button onClick={fetchStats} className="btn btn-primary">
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-card-icon">
                <Database size={18} />
              </div>
              <div className="summary-card-label">Stocks Tracked</div>
              <div className="summary-card-value">
                {dbStats?.stock_count?.toLocaleString() || 0}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card-icon">
                <CheckCircle size={18} />
              </div>
              <div className="summary-card-label">Price Records (Est.)</div>
              <div className="summary-card-value">
                {dbStats?.price_count?.toLocaleString() || 0}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-card-icon">
                <Clock size={18} />
              </div>
              <div className="summary-card-label">Date Range</div>
              <div className="summary-card-value text-sm">{dbStats?.date_range || 'N/A'}</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-icon">
                <ExternalLink size={18} />
              </div>
              <div className="summary-card-label">Actions Workflow</div>
              <div className="summary-card-value">
                <a
                  href="https://github.com/smtsrst/nepse-stockmarket-v2/actions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent"
                >
                  View →
                </a>
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <span className="flex items-center gap-2">
                <Database size={14} />
                DATA COVERAGE (Sample)
              </span>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th style={{ textAlign: 'right' }}>Records</th>
                    <th style={{ textAlign: 'right' }}>From</th>
                    <th style={{ textAlign: 'right' }}>To</th>
                  </tr>
                </thead>
                <tbody>
                  {symbols.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{ textAlign: 'center', padding: 32 }}
                        className="text-muted"
                      >
                        No historical data available yet
                      </td>
                    </tr>
                  ) : (
                    symbols.map((s) => (
                      <tr key={s.symbol}>
                        <td className="font-mono font-semibold">{s.symbol}</td>
                        <td className="font-mono" style={{ textAlign: 'right' }}>
                          {s.records}
                        </td>
                        <td className="font-mono text-secondary" style={{ textAlign: 'right' }}>
                          {s.first_date}
                        </td>
                        <td className="font-mono text-secondary" style={{ textAlign: 'right' }}>
                          {s.last_date}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-muted p-2 border-t border-border">
              Showing sample of {symbols.length} stocks. Run backfill to get full coverage.
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-header">
              <span className="flex items-center gap-2">
                <Database size={14} />
                MANUAL COLLECTION
              </span>
            </div>
            <div className="card-body">
              <p className="text-sm text-secondary mb-4">
                To collect data manually, run the following commands:
              </p>
              <div className="code-block">
                <code>
                  cd backend
                  <br />
                  source venv/bin/activate
                  <br />
                  python scripts/collect_live.py # Live prices
                  <br />
                  python scripts/backfill.py --days 1095 # 3 years history
                </code>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .data-management {
          max-width: 1200px;
          margin: 0 auto;
        }

        .info-box {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: var(--bg-tertiary);
          border-radius: 6px;
        }

        .info-box .text-accent {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          gap: 12px;
        }

        .code-block {
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 16px;
        }

        .code-block code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          color: var(--accent);
          white-space: pre;
          display: block;
          line-height: 1.6;
        }

        .summary-card-icon {
          color: var(--text-muted);
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}
