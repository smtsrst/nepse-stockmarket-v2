import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'https://frontend-eight-tan-70.vercel.app/api';

interface Stock {
  symbol: string;
  name: string;
  lastTradedPrice: number;
  percentageChange: number;
  volume: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
}

interface PriceHistory {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalAnalysis {
  symbol: string;
  current_price: number;
  rsi: number;
  macd: { macd: number; signal: number; histogram: number };
  sma: { sma_20: number; sma_50: number; sma_200: number };
  bollinger_bands: { upper: number; middle: number; lower: number };
  trend: string;
  signal: string;
}

interface Prediction {
  symbol: string;
  prediction: string;
  confidence: number;
  current_price: number;
  predicted_price?: number;
  change_percent?: number;
}

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const timeRangeDays: Record<TimeRange, number> = {
  '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'ALL': 1000,
};

export default function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [stock, setStock] = useState<Stock | null>(null);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [analysis, setAnalysis] = useState<TechnicalAnalysis | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (symbol) loadData();
  }, [symbol, timeRange]);

  const loadData = async (isRefresh = false) => {
    if (!symbol) return;
    try {
      if (isRefresh) setRefreshing(true);
      
      const [allStocks, historyData, analysisData, predictionData] = await Promise.all([
        fetch(`${API_URL}/stocks`).then(r => r.json()).catch(() => []),
        fetch(`${API_URL}/history?symbol=${symbol}&days=${timeRangeDays[timeRange]}`).then(r => r.json()).catch(() => null),
        fetch(`${API_URL}/analysis?symbol=${symbol}`).then(r => r.json()).catch(() => null),
        fetch(`${API_URL}/predict?symbol=${symbol}`).then(r => r.json()).catch(() => null),
      ]);

      const foundStock = Array.isArray(allStocks) ? allStocks.find((s: any) => s.symbol === symbol?.toUpperCase()) : null;
      if (foundStock) setStock(foundStock);
      
      if (historyData?.history) {
        setHistory(historyData.history.map((h: any) => ({
          date: h.date, open: h.open, high: h.high, low: h.low, close: h.close, volume: h.volume,
        })).reverse());
      }
      
      if (analysisData && !analysisData.error) setAnalysis(analysisData);
      if (predictionData && !predictionData.error) setPrediction(predictionData);
    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return dateStr; }
  };

  const chartData = history.map(h => ({
    date: formatDate(h.date),
    rawDate: h.date,
    price: h.close,
    high: h.high,
    low: h.low,
  }));

  const isPositive = (stock?.percentageChange || 0) >= 0;
  const trendColor = analysis?.trend === 'UPTREND' ? 'text-gain' : analysis?.trend === 'DOWNTREND' ? 'text-loss' : 'text-secondary';
  const signalColor = analysis?.signal === 'BUY' ? 'text-gain' : analysis?.signal === 'SELL' ? 'text-loss' : 'text-secondary';
  const chartColor = isPositive ? '#00ff41' : '#ff3333';

  return (
    <div className="stock-detail">
      {/* Header */}
      <div className="detail-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={16} />
        </button>
        
        <div className="stock-info">
          <div className="stock-symbol-large">{stock?.symbol || symbol}</div>
          <div className="stock-name-large">{stock?.name || 'Loading...'}</div>
        </div>

        {stock && (
          <div className="stock-price-display">
            <span className="current-price">Rs. {stock.lastTradedPrice?.toLocaleString()}</span>
            <span className={`price-change ${isPositive ? 'text-gain' : 'text-loss'}`}>
              {isPositive ? '+' : ''}{stock.percentageChange?.toFixed(2)}%
            </span>
          </div>
        )}

        <div className="header-actions">
          <div className="time-range-group">
            {(['1W', '1M', '3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`time-range-btn ${timeRange === range ? 'active' : ''}`}
              >
                {range}
              </button>
            ))}
          </div>
          <button onClick={() => loadData(true)} disabled={refreshing} className="btn btn-ghost">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="chart-section">
        <div className="card">
          <div className="card-header">
            <span>PRICE CHART</span>
            {analysis && (
              <span className={`signal-badge ${signalColor}`}>
                {analysis.signal} SIGNAL
              </span>
            )}
          </div>
          <div className="chart-container">
            {loading ? (
              <div className="loading-container"><div className="loading-spinner"></div></div>
            ) : chartData.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={32} />
                <p>No historical data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#333" tick={{ fill: '#666', fontSize: 10 }} axisLine={{ stroke: '#222' }} tickLine={false} />
                  <YAxis stroke="#333" tick={{ fill: '#666', fontSize: 10 }} axisLine={{ stroke: '#222' }} tickLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `Rs ${v}`} width={70} />
                  <Tooltip 
                    contentStyle={{ background: '#0a0a0a', border: '1px solid #222', fontSize: 12 }}
                    formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Price']}
                  />
                  {analysis?.bollinger_bands && (
                    <>
                      <ReferenceLine y={analysis.bollinger_bands.upper} stroke="#333" strokeDasharray="3 3" />
                      <ReferenceLine y={analysis.bollinger_bands.lower} stroke="#333" strokeDasharray="3 3" />
                    </>
                  )}
                  <Area type="monotone" dataKey="price" stroke={chartColor} strokeWidth={1.5} fill="url(#chartGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stock && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">OPEN</span>
            <span className="stat-value">Rs. {stock.openPrice?.toLocaleString()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">HIGH</span>
            <span className="stat-value text-gain">Rs. {stock.highPrice?.toLocaleString()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">LOW</span>
            <span className="stat-value text-loss">Rs. {stock.lowPrice?.toLocaleString()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">VOLUME</span>
            <span className="stat-value">{(stock.volume / 1000).toFixed(1)}K</span>
          </div>
        </div>
      )}

      {/* Analysis & Prediction Grid */}
      <div className="analysis-grid">
        {/* Technical Analysis */}
        <div className="card">
          <div className="card-header">TECHNICAL INDICATORS</div>
          <div className="card-body">
            {loading ? (
              <div className="loading-container"><div className="loading-spinner"></div></div>
            ) : !analysis ? (
              <div className="empty-state"><p>Analysis unavailable</p></div>
            ) : (
              <div className="indicators-grid">
                {/* RSI */}
                <div className="indicator-row">
                  <span className="indicator-label">RSI (14)</span>
                  <span className={`indicator-value ${
                    analysis.rsi >= 70 ? 'text-loss' : analysis.rsi <= 30 ? 'text-gain' : ''
                  }`}>
                    {analysis.rsi.toFixed(1)}
                  </span>
                </div>
                
                {/* MACD */}
                <div className="indicator-row">
                  <span className="indicator-label">MACD</span>
                  <span className="indicator-value">{analysis.macd.macd.toFixed(2)}</span>
                </div>
                <div className="indicator-row sub">
                  <span className="indicator-label">Signal</span>
                  <span className="indicator-value">{analysis.macd.signal.toFixed(2)}</span>
                </div>
                <div className="indicator-row sub">
                  <span className="indicator-label">Histogram</span>
                  <span className={`indicator-value ${analysis.macd.histogram >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {analysis.macd.histogram.toFixed(2)}
                  </span>
                </div>

                {/* SMA */}
                <div className="indicator-row">
                  <span className="indicator-label">SMA 20</span>
                  <span className="indicator-value">Rs. {analysis.sma.sma_20.toFixed(2)}</span>
                </div>
                <div className="indicator-row">
                  <span className="indicator-label">SMA 50</span>
                  <span className="indicator-value">Rs. {analysis.sma.sma_50.toFixed(2)}</span>
                </div>

                {/* Bollinger */}
                <div className="indicator-row">
                  <span className="indicator-label">BB Upper</span>
                  <span className="indicator-value">Rs. {analysis.bollinger_bands.upper.toFixed(2)}</span>
                </div>
                <div className="indicator-row">
                  <span className="indicator-label">BB Lower</span>
                  <span className="indicator-value">Rs. {analysis.bollinger_bands.lower.toFixed(2)}</span>
                </div>

                {/* Trend */}
                <div className="indicator-row trend-row">
                  <span className="indicator-label">TREND</span>
                  <span className={`trend-badge ${trendColor}`}>
                    {analysis.trend === 'UPTREND' && <TrendingUp size={14} />}
                    {analysis.trend === 'DOWNTREND' && <TrendingDown size={14} />}
                    {analysis.trend}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ML Prediction */}
        <div className="card">
          <div className="card-header">ML PREDICTION</div>
          <div className="card-body">
            {loading ? (
              <div className="loading-container"><div className="loading-spinner"></div></div>
            ) : !prediction ? (
              <div className="empty-state"><p>Prediction unavailable</p></div>
            ) : (
              <div className="prediction-section">
                <div className={`prediction-icon ${prediction.prediction === 'UP' ? 'up' : prediction.prediction === 'DOWN' ? 'down' : 'neutral'}`}>
                  {prediction.prediction === 'UP' && <ArrowUp size={32} />}
                  {prediction.prediction === 'DOWN' && <ArrowDown size={32} />}
                </div>
                <div className="prediction-text">
                  <span className={`prediction-label ${
                    prediction.prediction === 'UP' ? 'text-gain' : 
                    prediction.prediction === 'DOWN' ? 'text-loss' : 'text-secondary'
                  }`}>
                    {prediction.prediction === 'UP' ? 'BULLISH' : prediction.prediction === 'DOWN' ? 'BEARISH' : 'NEUTRAL'}
                  </span>
                </div>
                <div className="confidence-bar">
                  <div className="confidence-label">
                    <span>Confidence</span>
                    <span>{(prediction.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="confidence-track">
                    <div className="confidence-fill" style={{ width: `${prediction.confidence * 100}%` }}></div>
                  </div>
                </div>
                {prediction.predicted_price && (
                  <div className="prediction-prices">
                    <div className="pred-price">
                      <span className="pred-label">Current</span>
                      <span className="pred-value">Rs. {prediction.current_price.toLocaleString()}</span>
                    </div>
                    <div className="pred-price">
                      <span className="pred-label">Predicted</span>
                      <span className={`pred-value ${(prediction.change_percent || 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                        Rs. {prediction.predicted_price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                <div className="prediction-disclaimer">
                  ML predictions are for educational purposes only.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .stock-detail {
          max-width: 1400px;
          margin: 0 auto;
        }

        .detail-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          cursor: pointer;
        }

        .back-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .stock-info {
          flex: 1;
        }

        .stock-symbol-large {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .stock-name-large {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .stock-price-display {
          text-align: right;
        }

        .current-price {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.3rem;
          font-weight: 600;
          display: block;
        }

        .price-change {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .signal-badge {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .chart-section {
          margin-bottom: 16px;
        }

        .chart-container {
          padding: 8px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .stat-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          padding: 12px;
        }

        .stat-label {
          display: block;
          font-size: 0.68rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .stat-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1rem;
          font-weight: 600;
        }

        .analysis-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .indicators-grid {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .indicator-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--border);
        }

        .indicator-row.sub {
          padding-left: 16px;
          background: var(--bg-tertiary);
          margin: 0 -12px;
          padding-right: 12px;
        }

        .indicator-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .indicator-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .trend-row {
          border-bottom: none;
        }

        .trend-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .prediction-section {
          text-align: center;
        }

        .prediction-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
        }

        .prediction-icon.up {
          background: var(--gain-bg);
          color: var(--gain);
        }

        .prediction-icon.down {
          background: var(--loss-bg);
          color: var(--loss);
        }

        .prediction-icon.neutral {
          background: var(--bg-tertiary);
          color: var(--text-muted);
        }

        .prediction-label {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .confidence-bar {
          margin-top: 20px;
        }

        .confidence-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-bottom: 6px;
        }

        .confidence-track {
          height: 6px;
          background: var(--bg-tertiary);
        }

        .confidence-fill {
          height: 100%;
          background: var(--accent);
          transition: width 0.3s;
        }

        .prediction-prices {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 20px;
        }

        .pred-price {
          padding: 12px;
          background: var(--bg-tertiary);
        }

        .pred-label {
          display: block;
          font-size: 0.68rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .pred-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1rem;
          font-weight: 600;
        }

        .prediction-disclaimer {
          margin-top: 20px;
          font-size: 0.68rem;
          color: var(--text-muted);
          text-align: center;
        }

        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
        }

        @media (max-width: 900px) {
          .analysis-grid {
            grid-template-columns: 1fr;
          }
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
