import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.NEON_DATABASE_URL || process.env.NEON_URL || process.env.DATABASE_URL;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured', message: 'ML predictions require database' });
  }

  const sql = neon(connectionString);

  try {
    const symbol = (req.query.symbol as string)?.toUpperCase();
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    const prediction = await sql`
      SELECT * FROM predictions 
      WHERE symbol = ${symbol} 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    if (!prediction || prediction.length === 0) {
      return res.status(404).json({
        symbol: symbol,
        error: 'No prediction available',
        message: 'Run ML training first'
      });
    }

    const p = prediction[0];
    return res.status(200).json({
      symbol: p.symbol,
      prediction: p.prediction,
      confidence: p.confidence,
      current_price: p.current_price,
      predicted_price: p.predicted_price,
      change_percent: p.change_percent,
      prob_up: p.prediction === 'UP' ? p.confidence : 1 - p.confidence,
      prob_down: p.prediction === 'DOWN' ? p.confidence : 1 - p.confidence,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to fetch prediction', details: error.message });
  }
}
