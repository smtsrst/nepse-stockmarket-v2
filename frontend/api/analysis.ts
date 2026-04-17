import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.NEON_DATABASE_URL || process.env.NEON_URL || process.env.DATABASE_URL;

function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change; else losses -= change;
  }
  const avgGain = gains / period, avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  const signal = macd * 0.8;
  const histogram = macd - signal;
  return { macd, signal, histogram };
}

function calculateBollingerBands(prices: number[], period = 20): { upper: number; middle: number; lower: number } {
  if (prices.length < period) {
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return { upper: avg * 1.1, middle: avg, lower: avg * 0.9 };
  }
  const sma = calculateSMA(prices, period);
  const squaredDiffs = prices.slice(-period).map(p => Math.pow(p - sma, 2));
  const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);
  return {
    upper: sma + 2 * stdDev,
    middle: sma,
    lower: sma - 2 * stdDev,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  const sql = neon(connectionString);

  try {
    const symbol = (req.query.symbol as string)?.toUpperCase();
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    const stockPrices = await sql`
      SELECT * FROM stock_prices 
      WHERE symbol = ${symbol} 
      ORDER BY date DESC 
      LIMIT 200
    `;

    if (stockPrices.length < 50) {
      return res.status(200).json({
        symbol: symbol,
        error: `Insufficient data (need 50, got ${stockPrices.length})`,
      });
    }

    const chronological = [...stockPrices].reverse();
    const closes = chronological.map((p: any) => p.close || 0).filter((c: number) => c > 0);
    const currentPrice = closes[closes.length - 1] || 0;

    const rsi = calculateRSI(closes);
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const sma200 = calculateSMA(closes, 200);
    const macd = calculateMACD(closes);
    const bollinger = calculateBollingerBands(closes);

    let trend = 'SIDEWAYS';
    if (currentPrice > sma20 && sma20 > sma50 && sma50 > sma200) trend = 'UPTREND';
    else if (currentPrice < sma20 && sma20 < sma50 && sma50 < sma200) trend = 'DOWNTREND';

    let signal = 'HOLD';
    if (rsi < 30) signal = 'BUY';
    else if (rsi > 70) signal = 'SELL';

    return res.status(200).json({
      symbol: symbol,
      current_price: currentPrice,
      rsi,
      macd,
      sma: { sma_20: sma20, sma_50: sma50, sma_200: sma200 },
      bollinger_bands: bollinger,
      trend,
      signal,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to calculate analysis', details: error.message });
  }
}
