import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../db';
import { StockPrice } from '../../db';

function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 };
  }
  
  // Calculate EMAs
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  
  // Signal line is 9-day EMA of MACD (simplified)
  const signal = macdLine * 0.9; // Approximation
  
  return {
    macd: macdLine,
    signal: signal,
    histogram: macdLine - signal,
  };
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(prices.slice(0, period), period);
  
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

function calculateBollingerBands(prices: number[], period = 20): { upper: number; middle: number; lower: number } {
  if (prices.length < period) {
    const lastPrice = prices[prices.length - 1] || 0;
    return { upper: lastPrice, middle: lastPrice, lower: lastPrice };
  }
  
  const sma = calculateSMA(prices, period);
  const slice = prices.slice(-period);
  const squaredDiffs = slice.map(p => Math.pow(p - sma, 2));
  const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);
  
  return {
    upper: sma + (2 * stdDev),
    middle: sma,
    lower: sma - (2 * stdDev),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const stockPrices = await query<StockPrice>(
      `SELECT * FROM stock_prices 
       WHERE symbol = $1 
       ORDER BY date DESC 
       LIMIT 200`,
      [String(symbol).toUpperCase()]
    );

    if (stockPrices.length < 50) {
      return res.status(200).json({
        symbol: String(symbol).toUpperCase(),
        error: `Insufficient historical data (need 50, got ${stockPrices.length})`,
      });
    }

    // Reverse to get chronological order
    const chronological = stockPrices.reverse();
    const closes = chronological.map(p => p.close || 0).filter(c => c > 0);
    const currentPrice = closes[closes.length - 1] || 0;

    // Calculate indicators
    const rsi = calculateRSI(closes);
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const sma200 = calculateSMA(closes, 200);
    const macd = calculateMACD(closes);
    const bollinger = calculateBollingerBands(closes);

    // Determine trend
    let trend = 'SIDEWAYS';
    if (currentPrice > sma20 && sma20 > sma50 && sma50 > sma200) {
      trend = 'UPTREND';
    } else if (currentPrice < sma20 && sma20 < sma50 && sma50 < sma200) {
      trend = 'DOWNTREND';
    }

    // Generate signal
    let signal = 'HOLD';
    if (rsi < 30 && macd.histogram > 0) {
      signal = 'BUY';
    } else if (rsi > 70 && macd.histogram < 0) {
      signal = 'SELL';
    } else if (trend === 'UPTREND' && rsi < 60) {
      signal = 'BUY';
    } else if (trend === 'DOWNTREND' && rsi > 40) {
      signal = 'SELL';
    }

    return res.status(200).json({
      symbol: String(symbol).toUpperCase(),
      current_price: currentPrice,
      rsi,
      macd,
      sma: {
        sma_20: sma20,
        sma_50: sma50,
        sma_200: sma200,
      },
      bollinger_bands: bollinger,
      trend,
      signal,
    });
  } catch (error) {
    console.error('Error calculating analysis:', error);
    return res.status(500).json({ error: 'Failed to calculate analysis' });
  }
}
