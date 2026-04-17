import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, TrendingUp, TrendingDown, RefreshCw, 
  BarChart3, Activity, Target, Brain, Calendar,
  ArrowUp, ArrowDown, Minus, AlertCircle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Area, AreaChart, ReferenceLine
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'https://nepse-backend-jv9v.onrender.com/api';

interface Stock {
  symbol: string;
  name: string;
  lastTradedPrice: number;
  percentageChange: number;
  volume: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  sector?: string;
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
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  sma: {
    sma_20: number;
    sma_50: number;
    sma_200: number;
  };
  bollinger_bands: {
    upper: number;
    middle: number;
    lower: number;
  };
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
  prob_up?: number;
  prob_down?: number;
}

type TimeRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const timeRangeDays: Record<TimeRange, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  'ALL': 1000,
};

export default function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const [stock, setStock] = useState<Stock | null>(null);
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [analysis, setAnalysis] = useState<TechnicalAnalysis | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (symbol) {
      loadData();
    }
  }, [symbol, timeRange]);

  const loadData = async (isRefresh = false) => {
    if (!symbol) return;
    
    try {
      if (isRefresh) setRefreshing(true);
      
      const [stockData, historyData, analysisData, predictionData] = await Promise.all([
        fetch(`${API_URL}/stocks/${symbol}`).then(r => r.json()).catch(() => null),
        fetch(`${API_URL}/stocks/${symbol}/history?days=${timeRangeDays[timeRange]}`).then(r => r.json()).catch(() => ({ history: [] })),
        fetch(`${API_URL}/stocks/${symbol}/analysis`).then(r => r.json()).catch(() => null),
        fetch(`${API_URL}/predict/${symbol}`).then(r => r.json()).catch(() => null),
      ]);

      if (stockData && !stockData.detail) {
        setStock(stockData);
      }
      
      if (historyData && historyData.history) {
        const formattedHistory = historyData.history.map((h: any) => ({
          date: h.date || h.timestamp,
          open: h.open || h.openPrice || h.close,
          high: h.high || h.highPrice || h.close,
          low: h.low || h.lowPrice || h.close,
          close: h.close || h.lastTradedPrice,
          volume: h.volume || 0,
        })).reverse();
        setHistory(formattedHistory);
      }
      
      if (analysisData && !analysisData.error) {
        setAnalysis(analysisData);
      }
      
      if (predictionData && !predictionData.error) {
        setPrediction(predictionData);
      }
    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getRSIColor = (rsi: number) => {
    if (rsi >= 70) return 'text-loss';
    if (rsi <= 30) return 'text-gain';
    return 'text-text-primary';
  };

  const getRSILabel = (rsi: number) => {
    if (rsi >= 70) return 'Overbought';
    if (rsi <= 30) return 'Oversold';
    return 'Neutral';
  };

  const getSignalColor = (signal: string) => {
    switch (signal?.toLowerCase()) {
      case 'buy': return 'text-gain';
      case 'sell': return 'text-loss';
      default: return 'text-text-secondary';
    }
  };

  const formatNumber = (num: number, decimals = 2) => {
    return num?.toFixed(decimals) || '0';
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const chartData = history.map(h => ({
    date: formatDate(h.date),
    price: h.close,
    high: h.high,
    low: h.low,
    volume: h.volume,
  }));

  const priceChange = stock?.percentageChange || 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/stocks"
            className="p-2 text-text-secondary hover:text-accent hover:bg-bg-secondary rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {stock && (
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-text-primary">{stock.symbol}</h1>
                <span className="text-text-secondary text-sm">{stock.name}</span>
                {stock.sector && (
                  <span className="px-2 py-0.5 bg-bg-tertiary rounded text-xs text-text-secondary">
                    {stock.sector}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-bold text-text-primary">
                  Rs. {stock.lastTradedPrice}
                </span>
                <span className={`flex items-center gap-1 text-lg font-semibold ${isPositive ? 'text-gain' : 'text-loss'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-bg-secondary border border-border rounded-lg overflow-hidden">
            {(['1W', '1M', '3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-accent text-bg-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button 
            onClick={() => loadData(true)} 
            disabled={refreshing}
            className="p-2 text-text-secondary hover:text-accent rounded-lg hover:bg-bg-secondary transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Price Chart */}
      <div className="bg-bg-secondary border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            Price Chart
          </h2>
          {analysis && (
            <span className={`text-sm font-medium ${getSignalColor(analysis.signal)}`}>
              {analysis.signal?.toUpperCase()} Signal
            </span>
          )}
        </div>
        {loading ? (
          <div className="h-80 flex items-center justify-center text-text-secondary">
            Loading chart...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-text-secondary">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p>No historical data available</p>
            <p className="text-xs mt-1">Try collecting data from the Data page</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="date" 
                stroke="#666" 
                tick={{ fill: '#888', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#666" 
                tick={{ fill: '#888', fontSize: 11 }}
                domain={['auto', 'auto']}
                tickFormatter={(v) => `Rs.${v}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #333',
                  borderRadius: '8px',
                  color: '#e5e5e5'
                }}
                formatter={(value: number) => [`Rs. ${value.toFixed(2)}`, 'Price']}
              />
              {analysis?.bollinger_bands && (
                <>
                  <ReferenceLine y={analysis.bollinger_bands.upper} stroke="#666" strokeDasharray="3 3" />
                  <ReferenceLine y={analysis.bollinger_bands.lower} stroke="#666" strokeDasharray="3 3" />
                </>
              )}
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? '#22c55e' : '#ef4444'}
                strokeWidth={2}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Key Statistics */}
      {stock && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-bg-secondary border border-border rounded-xl p-3">
            <div className="text-text-secondary text-xs mb-1">Open</div>
            <div className="text-text-primary font-semibold">Rs. {stock.openPrice || stock.closePrice || 0}</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-xl p-3">
            <div className="text-text-secondary text-xs mb-1">High</div>
            <div className="text-gain font-semibold">Rs. {stock.highPrice || 0}</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-xl p-3">
            <div className="text-text-secondary text-xs mb-1">Low</div>
            <div className="text-loss font-semibold">Rs. {stock.lowPrice || 0}</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-xl p-3">
            <div className="text-text-secondary text-xs mb-1">Close</div>
            <div className="text-text-primary font-semibold">Rs. {stock.closePrice || stock.lastTradedPrice || 0}</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-xl p-3">
            <div className="text-text-secondary text-xs mb-1">Volume</div>
            <div className="text-text-primary font-semibold">{stock.volume?.toLocaleString() || 0}</div>
          </div>
          <div className="bg-bg-secondary border border-border rounded-xl p-3">
            <div className="text-text-secondary text-xs mb-1">Change</div>
            <div className={`font-semibold ${isPositive ? 'text-gain' : 'text-loss'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          </div>
        </div>
      )}

      {/* Technical Analysis & ML Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Technical Indicators */}
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-accent" />
            Technical Analysis
          </h2>
          {loading ? (
            <div className="text-text-secondary py-4">Loading analysis...</div>
          ) : !analysis ? (
            <div className="text-text-secondary py-4">
              <AlertCircle className="w-6 h-6 mx-auto mb-2" />
              <p className="text-center text-sm">Analysis not available</p>
              <p className="text-center text-xs mt-1">Collect historical data first</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* RSI */}
              <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-bg-secondary rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-text-primary font-medium">RSI (14)</div>
                    <div className="text-text-secondary text-xs">{getRSILabel(analysis.rsi)}</div>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${getRSIColor(analysis.rsi)}`}>
                  {formatNumber(analysis.rsi, 1)}
                </div>
              </div>

              {/* MACD */}
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-bg-secondary rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-accent" />
                  </div>
                  <div className="text-text-primary font-medium">MACD</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-text-secondary text-xs">MACD</div>
                    <div className="text-text-primary font-medium">{formatNumber(analysis.macd?.macd || 0)}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs">Signal</div>
                    <div className="text-text-primary font-medium">{formatNumber(analysis.macd?.signal || 0)}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs">Histogram</div>
                    <div className={`font-medium ${(analysis.macd?.histogram || 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {formatNumber(analysis.macd?.histogram || 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* SMA */}
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-bg-secondary rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-accent" />
                  </div>
                  <div className="text-text-primary font-medium">Simple Moving Avg</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-text-secondary text-xs">SMA 20</div>
                    <div className="text-text-primary font-medium">Rs. {formatNumber(analysis.sma?.sma_20 || 0)}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs">SMA 50</div>
                    <div className="text-text-primary font-medium">Rs. {formatNumber(analysis.sma?.sma_50 || 0)}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs">SMA 200</div>
                    <div className="text-text-primary font-medium">Rs. {formatNumber(analysis.sma?.sma_200 || 0)}</div>
                  </div>
                </div>
              </div>

              {/* Bollinger Bands */}
              <div className="p-3 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-bg-secondary rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-accent" />
                  </div>
                  <div className="text-text-primary font-medium">Bollinger Bands</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-text-secondary text-xs">Upper</div>
                    <div className="text-text-primary font-medium">Rs. {formatNumber(analysis.bollinger_bands?.upper || 0)}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs">Middle</div>
                    <div className="text-text-primary font-medium">Rs. {formatNumber(analysis.bollinger_bands?.middle || 0)}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs">Lower</div>
                    <div className="text-text-primary font-medium">Rs. {formatNumber(analysis.bollinger_bands?.lower || 0)}</div>
                  </div>
                </div>
              </div>

              {/* Trend */}
              <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-bg-secondary rounded-lg flex items-center justify-center">
                    {analysis.trend === 'UPTREND' ? (
                      <TrendingUp className="w-5 h-5 text-gain" />
                    ) : analysis.trend === 'DOWNTREND' ? (
                      <TrendingDown className="w-5 h-5 text-loss" />
                    ) : (
                      <Minus className="w-5 h-5 text-text-secondary" />
                    )}
                  </div>
                  <div className="text-text-primary font-medium">Trend</div>
                </div>
                <div className={`font-semibold ${
                  analysis.trend === 'UPTREND' ? 'text-gain' : 
                  analysis.trend === 'DOWNTREND' ? 'text-loss' : 'text-text-secondary'
                }`}>
                  {analysis.trend || 'N/A'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ML Prediction */}
        <div className="bg-bg-secondary border border-border rounded-xl p-4">
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-accent" />
            ML Prediction
          </h2>
          {loading ? (
            <div className="text-text-secondary py-4">Loading prediction...</div>
          ) : !prediction ? (
            <div className="text-text-secondary py-4">
              <AlertCircle className="w-6 h-6 mx-auto mb-2" />
              <p className="text-center text-sm">Prediction not available</p>
              <p className="text-center text-xs mt-1">Train the model from the Data page</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Prediction Result */}
              <div className={`p-6 rounded-xl border-2 ${
                prediction.prediction === 'UP' ? 'border-gain/30 bg-gain/10' :
                prediction.prediction === 'DOWN' ? 'border-loss/30 bg-loss/10' :
                'border-border bg-bg-tertiary'
              }`}>
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${
                    prediction.prediction === 'UP' ? 'text-gain' :
                    prediction.prediction === 'DOWN' ? 'text-loss' :
                    'text-text-secondary'
                  }`}>
                    {prediction.prediction === 'UP' && <ArrowUp className="w-12 h-12 mx-auto" />}
                    {prediction.prediction === 'DOWN' && <ArrowDown className="w-12 h-12 mx-auto" />}
                    {prediction.prediction === 'HOLD' && <Minus className="w-12 h-12 mx-auto" />}
                  </div>
                  <div className="text-2xl font-bold text-text-primary">
                    {prediction.prediction === 'UP' ? 'Bullish' :
                     prediction.prediction === 'DOWN' ? 'Bearish' :
                     'Neutral'}
                  </div>
                  <div className="text-text-secondary text-sm mt-1">
                    Next Day Prediction
                  </div>
                </div>
              </div>

              {/* Confidence */}
              <div className="p-4 bg-bg-tertiary rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-secondary">Confidence</span>
                  <span className="text-text-primary font-semibold">{(prediction.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${prediction.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* Price Prediction */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                  <div className="text-text-secondary text-xs mb-1">Current Price</div>
                  <div className="text-text-primary font-semibold">Rs. {formatNumber(prediction.current_price)}</div>
                </div>
                {prediction.predicted_price && (
                  <div className="p-3 bg-bg-tertiary rounded-lg text-center">
                    <div className="text-text-secondary text-xs mb-1">Predicted Price</div>
                    <div className={`font-semibold ${
                      (prediction.change_percent || 0) >= 0 ? 'text-gain' : 'text-loss'
                    }`}>
                      Rs. {formatNumber(prediction.predicted_price)}
                    </div>
                  </div>
                )}
              </div>

              {/* Probability */}
              {(prediction.prob_up !== undefined || prediction.prob_down !== undefined) && (
                <div className="p-4 bg-bg-tertiary rounded-xl">
                  <div className="text-text-secondary text-sm mb-2">Probability</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-gain font-semibold">{((prediction.prob_up || 0) * 100).toFixed(1)}%</div>
                      <div className="text-text-secondary text-xs">Up</div>
                    </div>
                    <div className="text-center">
                      <div className="text-loss font-semibold">{((prediction.prob_down || 0) * 100).toFixed(1)}%</div>
                      <div className="text-text-secondary text-xs">Down</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Expected Change */}
              {prediction.change_percent !== undefined && (
                <div className={`p-4 rounded-xl flex items-center justify-between ${
                  prediction.change_percent >= 0 ? 'bg-gain/10' : 'bg-loss/10'
                }`}>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-text-secondary" />
                    <span className="text-text-secondary">Expected Change</span>
                  </div>
                  <div className={`text-xl font-bold ${
                    prediction.change_percent >= 0 ? 'text-gain' : 'text-loss'
                  }`}>
                    {prediction.change_percent >= 0 ? '+' : ''}{prediction.change_percent.toFixed(2)}%
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="text-xs text-text-secondary text-center p-3 bg-bg-tertiary rounded-lg">
                ML predictions are for educational purposes only. Not financial advice.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
