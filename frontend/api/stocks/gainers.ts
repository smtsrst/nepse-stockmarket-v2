import type { VercelRequest, VercelResponse } from '@vercel/node';

const YONEPSE_API = 'https://shubhamnpk.github.io/yonepse/data';

let gainersCache: {
  data: unknown[];
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
    if (gainersCache && Date.now() - gainersCache.timestamp < CACHE_DURATION) {
      return res.status(200).json(gainersCache.data);
    }

    // Fetch from YONEPSE API
    const response = await fetch(`${YONEPSE_API}/nepse_data.json`);

    if (!response.ok) {
      throw new Error(`YONEPSE API error: ${response.status}`);
    }

    const data = await response.json();
    const stocks = data || [];

    // Format and filter gainers
    const gainers = stocks
      .filter((s: any) => parseFloat(s.percent_change || 0) > 0)
      .sort((a: any, b: any) => parseFloat(b.percent_change || 0) - parseFloat(a.percent_change || 0))
      .slice(0, 20)
      .map((s: any) => ({
        symbol: s.symbol || '',
        name: s.name || '',
        lastTradedPrice: parseFloat(s.ltp || 0),
        percentageChange: parseFloat(s.percent_change || 0),
        volume: parseInt(s.volume || 0),
        openPrice: parseFloat(s.ltp || 0) - parseFloat(s.change || 0),
        highPrice: parseFloat(s.high || 0),
        lowPrice: parseFloat(s.low || 0),
      }));

    // Cache result
    gainersCache = {
      data: gainers,
      timestamp: Date.now(),
    };

    return res.status(200).json(gainers.slice(0, limit));
  } catch (error) {
    console.error('Error fetching gainers:', error);
    return res.status(500).json({ error: 'Failed to fetch gainers' });
  }
}
