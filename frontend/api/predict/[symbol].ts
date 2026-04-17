import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, queryOne } from '../db';
import { Prediction } from '../db';

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

    // Get latest prediction from database
    const prediction = await queryOne<Prediction & { open: number; high: number; low: number; close: number; percentage_change: number }>(
      `SELECT p.*, 
              sp.open as open, sp.high as high, sp.low as low, sp.close as close, sp.percentage_change
       FROM predictions p
       LEFT JOIN stock_prices sp ON sp.symbol = p.symbol AND sp.date = p.date
       WHERE p.symbol = $1
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [String(symbol).toUpperCase()]
    );

    if (prediction) {
      return res.status(200).json({
        symbol: prediction.symbol,
        prediction: prediction.prediction,
        confidence: prediction.confidence,
        current_price: prediction.current_price,
        predicted_price: prediction.predicted_price,
        change_percent: prediction.change_percent,
      });
    }

    // If no prediction in DB, return mock/stale prediction (for demo)
    // In production, ML predictions should always be pre-computed
    return res.status(200).json({
      symbol: String(symbol).toUpperCase(),
      error: 'No prediction available - run ML training first',
      prediction: 'HOLD',
      confidence: 0.5,
      current_price: 0,
    });
  } catch (error) {
    console.error('Error fetching prediction:', error);
    return res.status(500).json({ error: 'Failed to fetch prediction' });
  }
}
