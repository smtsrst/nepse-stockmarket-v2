import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query, isDbConfigured } from './db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!isDbConfigured()) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const symbol = req.query.symbol as string;
    const days = parseInt(req.query.days as string) || 30;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    const stockPrices = await query<any>(
      `SELECT * FROM stock_prices 
       WHERE symbol = $1 
       ORDER BY date DESC 
       LIMIT $2`,
      [symbol.toUpperCase(), days]
    );

    if (stockPrices.length === 0) {
      return res.status(404).json({ 
        error: 'No data found',
        symbol: symbol.toUpperCase()
      });
    }

    return res.status(200).json({
      symbol: symbol.toUpperCase(),
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
