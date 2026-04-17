import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.NEON_URL || process.env.DATABASE_URL;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!connectionString) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  const sql = neon(connectionString);

  try {
    const symbol = (req.query.symbol as string)?.toUpperCase();
    const days = parseInt(req.query.days as string) || 30;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    const stockPrices = await sql`
      SELECT * FROM stock_prices 
      WHERE symbol = ${symbol}
      ORDER BY date DESC 
      LIMIT ${days}
    `;

    if (stockPrices.length === 0) {
      return res.status(404).json({ 
        error: 'No data found',
        symbol: symbol
      });
    }

    return res.status(200).json({
      symbol: symbol,
      days,
      source: 'db',
      record_count: stockPrices.length,
      history: stockPrices.map((p: any) => ({
        date: p.date,
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume,
      })),
    });
  } catch (error: any) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to fetch history', details: error.message });
  }
}
