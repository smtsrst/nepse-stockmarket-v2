import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, isDbConfigured } from './db';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (!isDbConfigured()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const symbol = req.query.symbol as string;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    const stockPrices = await query<any>(
      `SELECT * FROM stock_prices WHERE symbol = $1 ORDER BY date DESC LIMIT 200`,
      [symbol.toUpperCase()]
    );

    if (stockPrices.length < 50) {
      return res.status(200).json({
        symbol: symbol.toUpperCase(),
        error: `Insufficient data (need 50, got ${stockPrices.length})`,
      });
    }

    const chronological = stockPrices.reverse();
    const closes = chronological.map((p: any) => p.close || 0).filter((c: number) => c > 0);
    const currentPrice = closes[closes.length - 1] || 0;

    const rsi = calculateRSI(closes);
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const sma200 = calculateSMA(closes, 200);

    let trend = 'SIDEWAYS';
    if (currentPrice > sma20 && sma20 > sma50 && sma50 > sma200) trend = 'UPTREND';
    else if (currentPrice < sma20 && sma20 < sma50 && sma50 < sma200) trend = 'DOWNTREND';

    let signal = 'HOLD';
    if (rsi < 30) signal = 'BUY';
    else if (rsi > 70) signal = 'SELL';

    return res.status(200).json({
      symbol: symbol.toUpperCase(),
      current_price: currentPrice,
      rsi,
      sma: { sma_20: sma20, sma_50: sma50, sma_200: sma200 },
      trend,
      signal,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to calculate analysis', details: error.message });
  }
}
