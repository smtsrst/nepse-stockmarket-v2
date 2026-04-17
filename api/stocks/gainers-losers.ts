import type { VercelRequest, VercelResponse } from '@vercel/node';

const YONEPSE_API = 'https://shubhamnpk.github.io/yonepse/data';

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

    // Fetch from YONEPSE API
    const response = await fetch(`${YONEPSE_API}/nepse_data.json`);

    if (!response.ok) {
      throw new Error(`YONEPSE API error: ${response.status}`);
    }

    const data = await response.json();
    const stocks = data || [];

    // Format stocks
    const formatted = stocks.map((s: any) => ({
      symbol: s.symbol || '',
      name: s.name || '',
      lastTradedPrice: parseFloat(s.ltp || 0),
      percentageChange: parseFloat(s.percent_change || 0),
      volume: parseInt(s.volume || 0),
      openPrice: parseFloat(s.ltp || 0) - parseFloat(s.change || 0),
      highPrice: parseFloat(s.high || 0),
      lowPrice: parseFloat(s.low || 0),
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
