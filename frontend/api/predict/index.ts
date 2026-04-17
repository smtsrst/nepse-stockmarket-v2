import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, queryOne, isDbConfigured } from '../db';
import { Prediction } from '../db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!isDbConfigured()) {
      return res.status(503).json({ 
        error: 'Database not configured',
        message: 'ML predictions require database setup'
      });
    }

    const symbol = req.query.symbol as string;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    const prediction = await queryOne<Prediction>(
      `SELECT * FROM predictions 
       WHERE symbol = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [symbol.toUpperCase()]
    );

    if (!prediction) {
      return res.status(404).json({
        symbol: symbol.toUpperCase(),
        error: 'No prediction available',
        message: 'Run ML training first'
      });
    }

    return res.status(200).json({
      symbol: prediction.symbol,
      prediction: prediction.prediction,
      confidence: prediction.confidence,
      current_price: prediction.current_price,
      predicted_price: prediction.predicted_price,
      change_percent: prediction.change_percent,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch prediction',
      details: error.message
    });
  }
}
