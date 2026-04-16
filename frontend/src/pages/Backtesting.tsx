import { useState } from 'react';
import { Play, TrendingUp, Calendar } from 'lucide-react';
import { BacktestConfig, BacktestResult, BacktestTrade } from '../types';
import StockSelect from '../components/StockSelect';

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

  const runBacktest = async () => {
    if (!config.symbol) {
      alert('Please select a stock');
      return;
    }

    setLoading(true);
    setResult(null);

    // Use direct backend URL - more reliable than proxy in some cases
    const url = `http://localhost:8000/api/stocks/history/${config.symbol}?days=365`;
    
    console.log('Fetching URL:', url);
    console.log('Symbol:', config.symbol);
    
    try {
      const response = await fetch(url);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const text = await response.text();
        console.error('Response error:', response.status, text);
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      console.log('Data received:', data);
      const history = data.history || [];

      if (history.length === 0) {
        alert('No historical data available for this symbol');
        setLoading(false);
        return;
      }

      if (data.detail) {
        throw new Error(data.detail);
      }

      const backtestResult = simulateBacktest(history, config);
      setResult(backtestResult);
    } catch (error: unknown) {
      console.error('Backtest error:', error);
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to run backtest: ${errMsg}\n\nURL: ${url}`);
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
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Backtesting Tool</h1>
        <p className="text-text-secondary text-sm mb-6">
          Test trading strategies on historical data. Simulate how a strategy would have performed in the past.
        </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 bg-bg-secondary rounded-lg border border-border">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-text-secondary text-sm mb-1">Symbol</label>
                <StockSelect
                  value={config.symbol}
                  onChange={(symbol) => setConfig({ ...config, symbol })}
                  placeholder="Select stock..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-1">Start Date</label>
                  <input
                    type="date"
                    value={config.start_date}
                    onChange={(e) => setConfig({ ...config, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-1">End Date</label>
                  <input
                    type="date"
                    value={config.end_date}
                    onChange={(e) => setConfig({ ...config, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-1">Initial Capital (Rs.)</label>
                <input
                  type="number"
                  value={config.initial_capital}
                  onChange={(e) => setConfig({ ...config, initial_capital: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm mb-1">Strategy</label>
                <select
                  value={config.strategy}
                  onChange={(e) => setConfig({ ...config, strategy: e.target.value as BacktestConfig['strategy'] })}
                  className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary"
                >
                  <option value="SMA_CROSS">SMA Crossover</option>
                  <option value="HOLD">Buy & Hold</option>
                </select>
              </div>

              {config.strategy === 'SMA_CROSS' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-text-secondary text-sm mb-1">Short SMA</label>
                    <input
                      type="number"
                      value={config.sma_short}
                      onChange={(e) => setConfig({ ...config, sma_short: parseInt(e.target.value) || 20 })}
                      className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm mb-1">Long SMA</label>
                    <input
                      type="number"
                      value={config.sma_long}
                      onChange={(e) => setConfig({ ...config, sma_long: parseInt(e.target.value) || 50 })}
                      className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary"
                    />
                  </div>
                </div>
              )}

              <div className="p-3 bg-bg-tertiary rounded-lg text-sm text-text-secondary">
                <div className="font-medium text-text-primary mb-1">Strategy Guide:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>SMA Crossover:</strong> Buy when short-term SMA crosses above long-term SMA, sell when it crosses below</li>
                  <li><strong>Buy & Hold:</strong> Simple buy at start, hold until end (baseline for comparison)</li>
                </ul>
              </div>

              <button
                onClick={runBacktest}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent text-bg-primary rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {loading ? 'Running...' : 'Run Backtest'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <div className="text-text-secondary text-sm mb-1">Final Capital</div>
                  <div className="text-xl font-bold text-text-primary">{formatCurrency(result.final_capital)}</div>
                </div>
                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <div className="text-text-secondary text-sm mb-1">Total Return</div>
                  <div className={`text-xl font-bold ${result.total_return >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {result.total_return >= 0 ? '+' : ''}{result.total_return_percent.toFixed(2)}%
                  </div>
                </div>
                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <div className="text-text-secondary text-sm mb-1">Total Trades</div>
                  <div className="text-xl font-bold text-text-primary">{result.total_trades}</div>
                </div>
                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <div className="text-text-secondary text-sm mb-1">Win Rate</div>
                  <div className="text-xl font-bold text-text-primary">{result.win_rate.toFixed(1)}%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <div className="text-text-secondary text-sm mb-1">Max Drawdown</div>
                  <div className="text-lg font-semibold text-loss">
                    {formatCurrency(result.max_drawdown)} ({result.max_drawdown_percent.toFixed(2)}%)
                  </div>
                </div>
                <div className="p-4 bg-bg-secondary rounded-lg border border-border">
                  <div className="text-text-secondary text-sm mb-1">Winning/Losing</div>
                  <div className="text-lg font-semibold text-text-primary">
                    <span className="text-gain">{result.winning_trades}</span> / <span className="text-loss">{result.losing_trades}</span>
                  </div>
                </div>
              </div>

              <div className="bg-bg-secondary rounded-lg border border-border overflow-hidden">
                <div className="p-3 bg-bg-tertiary border-b border-border">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Trade History
                  </h3>
                </div>
                <table className="w-full">
                  <thead className="bg-bg-tertiary">
                    <tr>
                      <th className="px-4 py-2 text-left text-text-secondary font-medium">Date</th>
                      <th className="px-4 py-2 text-left text-text-secondary font-medium">Type</th>
                      <th className="px-4 py-2 text-right text-text-secondary font-medium">Price</th>
                      <th className="px-4 py-2 text-right text-text-secondary font-medium">Qty</th>
                      <th className="px-4 py-2 text-right text-text-secondary font-medium">Amount</th>
                      <th className="px-4 py-2 text-left text-text-secondary font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((trade, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="px-4 py-2 text-text-primary text-sm">{trade.date}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              trade.type === 'BUY' ? 'bg-loss/20 text-loss' : 'bg-gain/20 text-gain'
                            }`}
                          >
                            {trade.type}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-text-primary">Rs. {trade.price.toLocaleString()}</td>
                        <td className="px-4 py-2 text-right text-text-primary">{trade.quantity}</td>
                        <td className="px-4 py-2 text-right text-text-primary">{formatCurrency(trade.amount)}</td>
                        <td className="px-4 py-2 text-text-secondary text-sm">{trade.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-bg-secondary rounded-lg border border-border text-center">
              <TrendingUp className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <p className="text-text-secondary">
                Configure your backtest parameters and click "Run Backtest" to see results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}