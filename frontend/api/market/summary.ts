import type { VercelRequest, VercelResponse } from '@vercel/node';

const NEPSE_API_BASE = 'https://api.nepseapi.com';

// Cache for 5 minutes
let summaryCache: {
  data: unknown;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check cache
    if (summaryCache && Date.now() - summaryCache.timestamp < CACHE_DURATION) {
      return res.status(200).json(summaryCache.data);
    }

    const response = await fetch(`${NEPSE_API_BASE}/api/market/todayprice?sort=scrip%20ASC&size=500`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`NEPSE API error: ${response.status}`);
    }

    const data = await response.json();
    const stocks = data.data || data || [];

    // Calculate summary
    const summary = {
      total_turnover: stocks.reduce((sum: number, s: any) => sum + (parseFloat(s.turnover || 0) * parseFloat(s.closePrice || s.lastTradedPrice || 0) / 10000000), 0),
      total_trade: stocks.reduce((sum: number, s: any) => sum + (parseFloat(s.numberOfTransactions || 0)), 0),
      total_share: stocks.reduce((sum: number, s: any) => sum + (parseInt(s.volume || 0)), 0),
      total_companies: stocks.length,
    };

    // Cache result
    summaryCache = {
      data: summary,
      timestamp: Date.now(),
    };

    return res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching market summary:', error);
    return res.status(500).json({ error: 'Failed to fetch market summary' });
  }
}
