import { useState } from 'react';
import { api } from '../api/client';
import PriceChart from '../components/Charts/PriceChart';
import StockSelect from '../components/StockSelect';
import type { TechnicalAnalysis, StockData, StockPrediction } from '../types';

export default function Analysis() {
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [searchedSymbol, setSearchedSymbol] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TechnicalAnalysis | null>(null);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [prediction, setPrediction] = useState<StockPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (symbol: string) => {
    if (!symbol.trim()) return;

    setLoading(true);
    setError('');
    setSelectedSymbol(symbol);
    setSearchedSymbol(symbol.toUpperCase());
    setAnalysis(null);
    setPrediction(null);

    try {
      const [stock, analysisData, predictionData] = await Promise.all([
        api.getStock(symbol),
        api.getStockAnalysis(symbol),
        api.getStockPrediction(symbol).catch(() => null),
      ]);

      setStockData(stock);
      setAnalysis(analysisData);
      setPrediction(predictionData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (rec?: string) => {
    switch (rec) {
      case 'STRONG_BUY':
      case 'BUY':
        return 'text-gain';
      case 'STRONG_SELL':
      case 'SELL':
        return 'text-loss';
      default:
        return 'text-text-secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Stock Analysis</h1>
        <p className="text-text-secondary text-sm">Technical indicators and signals</p>
      </div>

      {/* Stock Selector */}
      <div className="flex gap-2">
        <div className="flex-1">
          <StockSelect
            value={selectedSymbol}
            onChange={handleSearch}
            placeholder="Select a stock..."
          />
        </div>
        <button 
          onClick={() => selectedSymbol && handleSearch(selectedSymbol)}
          disabled={!selectedSymbol || loading}
          className="button disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Analyze'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-loss/10 border border-loss rounded text-loss text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Stock Info with Chart */}
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-text-primary">{searchedSymbol}</h2>
                <p className="text-text-secondary">{stockData?.name}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-text-primary">
                  NPR {stockData?.last_traded_price?.toFixed(2)}
                </div>
                <div className={`text-sm ${(stockData?.percentage_change || 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                  {(stockData?.percentage_change || 0) >= 0 ? '+' : ''}
                  {stockData?.percentage_change?.toFixed(2)}%
                </div>
              </div>
            </div>
            {/* Price Chart */}
            {searchedSymbol && <PriceChart symbol={searchedSymbol} />}
          </div>

          {/* Recommendation */}
          <div className="card">
            <h3 className="text-text-secondary text-sm mb-2">Recommendation</h3>
            <div className={`text-2xl font-bold ${getRecommendationColor(analysis.recommendation)}`}>
              {analysis.recommendation || 'N/A'}
            </div>
          </div>

          {/* ML Prediction */}
          {prediction && (
            <div className="card border-accent/30">
              <h3 className="text-text-secondary text-sm mb-2">ML Prediction (Next Day)</h3>
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold ${prediction.prediction === 'UP' ? 'text-gain' : 'text-loss'}`}>
                  {prediction.prediction === 'UP' ? '↑' : '↓'} {prediction.prediction}
                </div>
                <div className="flex-1">
                  <div className="text-text-secondary text-sm">
                    Confidence: {(prediction.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="flex gap-2 mt-1">
                    <div className="text-xs text-gain">UP: {(prediction.prob_up * 100).toFixed(1)}%</div>
                    <div className="text-xs text-loss">DOWN: {(prediction.prob_down * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Technical Indicators */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card">
              <h3 className="text-text-secondary text-sm mb-2">RSI (14)</h3>
              <div className="text-xl font-bold text-text-primary">
                {analysis.rsi?.toFixed(2) || 'N/A'}
              </div>
              <p className="text-text-secondary text-xs mt-1">
                {analysis.rsi && analysis.rsi < 30
                  ? 'Oversold - Potential BUY'
                  : analysis.rsi && analysis.rsi > 70
                  ? 'Overbought - Potential SELL'
                  : 'Neutral'}
              </p>
            </div>

            <div className="card">
              <h3 className="text-text-secondary text-sm mb-2">MACD</h3>
              <div className="text-xl font-bold text-text-primary">
                {analysis.macd?.toFixed(2) || 'N/A'}
              </div>
              <p className="text-text-secondary text-xs mt-1">
                Signal: {analysis.macd_signal?.toFixed(2) || 'N/A'}
              </p>
            </div>

            <div className="card">
              <h3 className="text-text-secondary text-sm mb-2">MACD Histogram</h3>
              <div className={`text-xl font-bold ${(analysis.macd_histogram || 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                {(analysis.macd_histogram || 0) >= 0 ? '+' : ''}
                {analysis.macd_histogram?.toFixed(2) || 'N/A'}
              </div>
            </div>
          </div>

          {/* Moving Averages */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card">
              <h3 className="text-text-secondary text-sm mb-2">SMA 20</h3>
              <div className="text-xl font-bold text-text-primary">
                {analysis.sma_20 ? `NPR ${analysis.sma_20.toFixed(2)}` : 'N/A'}
              </div>
            </div>

            <div className="card">
              <h3 className="text-text-secondary text-sm mb-2">SMA 50</h3>
              <div className="text-xl font-bold text-text-primary">
                {analysis.sma_50 ? `NPR ${analysis.sma_50.toFixed(2)}` : 'N/A'}
              </div>
            </div>

            <div className="card">
              <h3 className="text-text-secondary text-sm mb-2">SMA 200</h3>
              <div className="text-xl font-bold text-text-primary">
                {analysis.sma_200 ? `NPR ${analysis.sma_200.toFixed(2)}` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Bollinger Bands */}
          <div className="card">
            <h3 className="text-text-secondary text-sm mb-4">Bollinger Bands</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-text-secondary text-xs">Upper</p>
                <p className="text-lg font-medium text-text-primary">
                  {analysis.bollinger_upper ? `NPR ${analysis.bollinger_upper.toFixed(2)}` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-text-secondary text-xs">Middle</p>
                <p className="text-lg font-medium text-text-primary">
                  {analysis.bollinger_middle ? `NPR ${analysis.bollinger_middle.toFixed(2)}` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-text-secondary text-xs">Lower</p>
                <p className="text-lg font-medium text-text-primary">
                  {analysis.bollinger_lower ? `NPR ${analysis.bollinger_lower.toFixed(2)}` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}