import { useState } from 'react';
import { Play, TrendingUp, Calendar, BarChart3 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://frontend-eight-tan-70.vercel.app/api';

interface BacktestConfig {
  symbol: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  strategy: 'SMA_CROSS' | 'HOLD';
  sma_short: number;
  sma_long: number;
}

interface BacktestTrade {
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  amount: number;
  reason: string;
}

interface BacktestResult {
  config: BacktestConfig;
  total_return: number;
  total_return_percent: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  max_drawdown: number;
  max_drawdown_percent: number;
  holdings: number;
  final_capital: number;
  trades: BacktestTrade[];
}

export default function Backtesting() {
  const [config, setConfig] = useState<BacktestConfig>({
    symbol: '',
    start_date: '2024-01-01',
    end_date: new Date().toISOString().split('T')[0],
    initial_capital: 100000,
    strategy: 'SMA_CROSS',
    sma_short: 20,
    sma_long: 50,
  });

  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = async () => {
    if (!config.symbol) {
      alert('Please select a stock');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/history?symbol=${config.symbol}&days=365`);
      const data = await response.json();
      const history = data.history || [];

      if (history.length === 0) {
        setError('No historical data available for this symbol');
        setLoading(false);
        return;
      }

      const backtestResult = simulateBacktest(history, config);
      setResult(backtestResult);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to run backtest: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const simulateBacktest = (history: { date: string; close: number }[], cfg: BacktestConfig): BacktestResult => {
    const prices = history.map((h) => ({ date: h.date, price: h.close }));
    const trades: BacktestTrade[] = [];
    let capital = cfg.initial_capital;
    let holdings = 0;

    const sma = (arr: number[], period: number) => {
      if (arr.length < period) return null;
      const slice = arr.slice(-period);
      return slice.reduce((a, b) => a + b, 0) / period;
    };

    const pricesOnly = prices.map((p) => p.price);

    for (let i = 50; i < pricesOnly.length; i++) {
      const currentPrice = pricesOnly[i];
      const currentDate = prices[i].date;
      const shortSMA = sma(pricesOnly.slice(0, i + 1), cfg.sma_short || 20);
      const longSMA = sma(pricesOnly.slice(0, i + 1), cfg.sma_long || 50);

      if (shortSMA === null || longSMA === null) continue;

      const prevShort = sma(pricesOnly.slice(0, i), cfg.sma_short || 20);
      const prevLong = sma(pricesOnly.slice(0, i), cfg.sma_long || 50);

      if (prevShort !== null && prevLong !== null) {
        if (prevShort <= prevLong && shortSMA > longSMA && capital > 0) {
          const qty = Math.floor(capital / currentPrice);
          if (qty > 0) {
            const amount = qty * currentPrice;
            holdings += qty;
            capital -= amount;
            trades.push({
              date: currentDate,
              type: 'BUY',
              price: currentPrice,
              quantity: qty,
              amount,
              reason: `SMA Cross: ${cfg.sma_short}/${cfg.sma_long}`,
            });
          }
        } else if (prevShort >= prevLong && shortSMA < longSMA && holdings > 0) {
          const amount = holdings * currentPrice;
          capital += amount;
          trades.push({
            date: currentDate,
            type: 'SELL',
            price: currentPrice,
            quantity: holdings,
            amount,
            reason: `SMA Cross Exit: ${cfg.sma_short}/${cfg.sma_long}`,
          });
          holdings = 0;
        }
      }
    }

    if (holdings > 0) {
      const finalPrice = pricesOnly[pricesOnly.length - 1];
      const amount = holdings * finalPrice;
      capital += amount;
      trades.push({
        date: prices[prices.length - 1].date,
        type: 'SELL',
        price: finalPrice,
        quantity: holdings,
        amount,
        reason: 'End of period',
      });
      holdings = 0;
    }

    const finalCapital = capital;
    const totalReturn = finalCapital - cfg.initial_capital;
    const totalReturnPercent = (totalReturn / cfg.initial_capital) * 100;

    const winningTrades = trades.filter((t) => t.type === 'SELL').filter((t, _i, arr) => {
      const buyTrades = arr.filter((x) => x.type === 'BUY');
      const idx = arr.indexOf(t);
      const prevBuy = buyTrades.findIndex((b) => arr.indexOf(b) < idx);
      return prevBuy >= 0 && t.amount > (buyTrades[prevBuy]?.amount || 0);
    }).length;

    const totalTrades = trades.filter((t) => t.type === 'BUY').length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    let maxDrawdown = 0;
    let peak = cfg.initial_capital;
    let runningCapital = cfg.initial_capital;

    trades.forEach((t) => {
      if (t.type === 'BUY') {
        runningCapital -= t.amount;
      } else {
        runningCapital += t.amount;
      }
      if (runningCapital > peak) peak = runningCapital;
      const dd = peak - runningCapital;
      if (dd > maxDrawdown) maxDrawdown = dd;
    });

    return {
      config: cfg,
      total_return: totalReturn,
      total_return_percent: totalReturnPercent,
      total_trades: totalTrades,
      winning_trades: winningTrades,
      losing_trades: totalTrades - winningTrades,
      win_rate: winRate,
      max_drawdown: maxDrawdown,
      max_drawdown_percent: (maxDrawdown / cfg.initial_capital) * 100,
      holdings,
      final_capital: finalCapital,
      trades,
    };
  };

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="backtesting">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">BACKTESTING</h1>
        </div>
      </div>

      <div className="backtest-grid">
        <div className="backtest-config">
          <div className="card">
            <div className="card-header">
              <span className="flex items-center gap-2">
                <BarChart3 size={14} />
                CONFIGURATION
              </span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Symbol</label>
                <input
                  type="text"
                  value={config.symbol}
                  onChange={(e) => setConfig({ ...config, symbol: e.target.value.toUpperCase() })}
                  className="form-input"
                  placeholder="e.g. NABIL"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    value={config.start_date}
                    onChange={(e) => setConfig({ ...config, start_date: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    value={config.end_date}
                    onChange={(e) => setConfig({ ...config, end_date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Capital (Rs.)</label>
                <input
                  type="number"
                  value={config.initial_capital}
                  onChange={(e) => setConfig({ ...config, initial_capital: parseInt(e.target.value) || 0 })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Strategy</label>
                <select
                  value={config.strategy}
                  onChange={(e) => setConfig({ ...config, strategy: e.target.value as BacktestConfig['strategy'] })}
                  className="form-select"
                >
                  <option value="SMA_CROSS">SMA Crossover</option>
                  <option value="HOLD">Buy & Hold</option>
                </select>
              </div>

              {config.strategy === 'SMA_CROSS' && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Short SMA</label>
                    <input
                      type="number"
                      value={config.sma_short}
                      onChange={(e) => setConfig({ ...config, sma_short: parseInt(e.target.value) || 20 })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Long SMA</label>
                    <input
                      type="number"
                      value={config.sma_long}
                      onChange={(e) => setConfig({ ...config, sma_long: parseInt(e.target.value) || 50 })}
                      className="form-input"
                    />
                  </div>
                </div>
              )}

              <div className="strategy-info">
                <div className="strategy-title">Strategy Guide:</div>
                <ul>
                  <li><strong>SMA Crossover:</strong> Buy when short SMA crosses above long SMA, sell when below</li>
                  <li><strong>Buy & Hold:</strong> Buy at start, hold until end (baseline)</li>
                </ul>
              </div>

              <button
                onClick={runBacktest}
                disabled={loading || !config.symbol}
                className="btn btn-primary btn-block"
              >
                <Play size={14} />
                {loading ? 'Running...' : 'Run Backtest'}
              </button>
            </div>
          </div>
        </div>

        <div className="backtest-results">
          {loading ? (
            <div className="card">
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <span className="mt-2">Running backtest...</span>
              </div>
            </div>
          ) : error ? (
            <div className="card">
              <div className="empty-state text-loss">
                {error}
              </div>
            </div>
          ) : result ? (
            <div className="results-content">
              <div className="summary-grid results-grid">
                <div className="summary-card">
                  <div className="summary-card-label">Final Capital</div>
                  <div className="summary-card-value">Rs. {result.final_capital.toLocaleString()}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-card-label">Total Return</div>
                  <div className={`summary-card-value ${result.total_return >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {result.total_return >= 0 ? '+' : ''}{result.total_return_percent.toFixed(2)}%
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-card-label">Total Trades</div>
                  <div className="summary-card-value">{result.total_trades}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-card-label">Win Rate</div>
                  <div className="summary-card-value">{result.win_rate.toFixed(1)}%</div>
                </div>
                <div className="summary-card">
                  <div className="summary-card-label">Max Drawdown</div>
                  <div className="summary-card-value text-loss">
                    {result.max_drawdown_percent.toFixed(2)}%
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-card-label">W/L Ratio</div>
                  <div className="summary-card-value">
                    <span className="text-gain">{result.winning_trades}</span>
                    {' / '}
                    <span className="text-loss">{result.losing_trades}</span>
                  </div>
                </div>
              </div>

              <div className="card mt-4">
                <div className="card-header">
                  <span className="flex items-center gap-2">
                    <Calendar size={14} />
                    TRADE HISTORY
                  </span>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th style={{ textAlign: 'right' }}>Price</th>
                        <th style={{ textAlign: 'right' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.map((trade, idx) => (
                        <tr key={idx}>
                          <td className="font-mono">{trade.date}</td>
                          <td>
                            <span className={`badge badge-${trade.type.toLowerCase()}`}>
                              {trade.type}
                            </span>
                          </td>
                          <td className="font-mono" style={{ textAlign: 'right' }}>
                            Rs. {trade.price.toLocaleString()}
                          </td>
                          <td className="font-mono" style={{ textAlign: 'right' }}>{trade.quantity}</td>
                          <td className="font-mono" style={{ textAlign: 'right' }}>
                            {formatCurrency(trade.amount)}
                          </td>
                          <td className="text-secondary">{trade.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="empty-state">
                <TrendingUp size={48} className="text-muted mb-4" />
                <p>Configure your backtest parameters and click "Run Backtest" to see results.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .backtesting {
          max-width: 1400px;
          margin: 0 auto;
        }

        .backtest-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 16px;
        }

        .backtest-config {
          position: sticky;
          top: 16px;
          height: fit-content;
        }

        .backtest-results {
          min-width: 0;
        }

        .results-grid {
          grid-template-columns: repeat(3, 1fr);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
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

        .form-input,
        .form-select {
          width: 100%;
          padding: 10px 12px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-primary);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--accent);
        }

        .form-select {
          cursor: pointer;
        }

        .strategy-info {
          padding: 12px;
          background: var(--bg-tertiary);
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 0.8rem;
        }

        .strategy-title {
          font-weight: 600;
          margin-bottom: 8px;
        }

        .strategy-info ul {
          margin: 0;
          padding-left: 16px;
          color: var(--text-secondary);
        }

        .strategy-info li {
          margin-bottom: 4px;
        }

        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge-buy {
          background: rgba(255, 59, 48, 0.2);
          color: #ff6b6b;
        }

        .badge-sell {
          background: rgba(0, 200, 83, 0.2);
          color: #00c853;
        }

        .btn-block {
          width: 100%;
        }

        .mt-2 {
          margin-top: 8px;
        }

        @media (max-width: 1024px) {
          .backtest-grid {
            grid-template-columns: 1fr;
          }

          .backtest-config {
            position: static;
          }

          .results-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .results-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
