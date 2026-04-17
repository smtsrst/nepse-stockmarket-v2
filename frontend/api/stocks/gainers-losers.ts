import type { VercelRequest, VercelResponse } from '@vercel/node';

const NEPSE_API_BASE = 'https://nepseapi.surajrimal.dev';

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

    // Fetch from both endpoints in parallel
    const [gainersRes, losersRes] = await Promise.all([
      fetch(`${NEPSE_API_BASE}/TopGainers?limit=20`),
      fetch(`${NEPSE_API_BASE}/TopLosers?limit=20`),
    ]);

    if (!gainersRes.ok || !losersRes.ok) {
      throw new Error(`NEPSE API error: ${gainersRes.status} / ${losersRes.status}`);
    }

    const gainersData = await gainersRes.json();
    const losersData = await losersRes.json();

    // Format gainers
    const gainers = (gainersData.data || gainersData || []).map((s: any) => ({
      symbol: s.symbol || s.scripSymbol || '',
      name: s.companyName || s.company || '',
      lastTradedPrice: parseFloat(s.closePrice || s.lastTradedPrice || 0),
      percentageChange: parseFloat(s.percentageChange || 0),
      volume: parseInt(s.volume || 0),
      openPrice: parseFloat(s.openPrice || 0),
      highPrice: parseFloat(s.highPrice || s.high || 0),
      lowPrice: parseFloat(s.lowPrice || s.low || 0),
    }));

    // Format losers
    const losers = (losersData.data || losersData || []).map((s: any) => ({
      symbol: s.symbol || s.scripSymbol || '',
      name: s.companyName || s.company || '',
      lastTradedPrice: parseFloat(s.closePrice || s.lastTradedPrice || 0),
      percentageChange: parseFloat(s.percentageChange || 0),
      volume: parseInt(s.volume || 0),
      openPrice: parseFloat(s.openPrice || 0),
      highPrice: parseFloat(s.highPrice || s.high || 0),
      lowPrice: parseFloat(s.lowPrice || s.low || 0),
    }));

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
