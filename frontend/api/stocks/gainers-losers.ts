import type { VercelRequest, VercelResponse } from '@vercel/node';

const NEPSE_API_BASE = 'https://api.nepseapi.com';

// Cache for 5 minutes
let cache: {
  gainers: unknown[];
  losers: unknown[];
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
    const limit = parseInt(req.query.limit as string) || 10;

    // Check cache
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      return res.status(200).json({
        gainers: cache.gainers.slice(0, limit),
        losers: cache.losers.slice(0, limit),
      });
    }

    const response = await fetch(`${NEPSE_API_BASE}/api/market/todayprice?sort=scrip%20ASC&size=500`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`NEPSE API error: ${response.status}`);
    }

    const data = await response.json();
    let stocks = data.data || data || [];

    // Format stocks
    const formatted = stocks.map((s: any) => ({
      symbol: s.symbol || s.scripSymbol || '',
      name: s.companyName || s.company || '',
      lastTradedPrice: parseFloat(s.closePrice || s.lastTradedPrice || 0),
      percentageChange: parseFloat(s.percentageChange || 0),
      volume: parseInt(s.volume || 0),
      openPrice: parseFloat(s.openPrice || 0),
      highPrice: parseFloat(s.highPrice || s.high || 0),
      lowPrice: parseFloat(s.lowPrice || s.low || 0),
    }));

    // Sort for gainers and losers
    const sorted = [...formatted].sort((a, b) => b.percentageChange - a.percentageChange);
    const gainers = sorted.filter(s => s.percentageChange > 0).slice(0, 20);
    const losers = sorted.filter(s => s.percentageChange < 0).slice(-20).reverse();

    // Cache result
    cache = {
      gainers,
      losers,
      timestamp: Date.now(),
    };

    return res.status(200).json({
      gainers: gainers.slice(0, limit),
      losers: losers.slice(0, limit),
    });
  } catch (error) {
    console.error('Error fetching gainers/losers:', error);
    return res.status(500).json({ error: 'Failed to fetch gainers/losers' });
  }
}
