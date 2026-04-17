import type { VercelRequest, VercelResponse } from '@vercel/node';

const NEPSE_API_BASE = 'https://api.nepseapi.com';

// Cache for market data (5 minutes)
let marketCache: {
  stocks: unknown[];
  summary: unknown;
  gainers: unknown[];
  losers: unknown[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchWithCache<T>(
  key: keyof typeof marketCache,
  fetcher: () => Promise<T>
): Promise<T> {
  if (marketCache && Date.now() - marketCache.timestamp < CACHE_DURATION && marketCache[key]) {
    return marketCache[key] as T;
  }

  const data = await fetcher();

  if (!marketCache) {
    marketCache = {
      stocks: [],
      summary: null,
      gainers: [],
      losers: [],
      timestamp: Date.now(),
    };
  }

  (marketCache as Record<string, unknown>)[key] = data;
  marketCache.timestamp = Date.now();

  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { limit = 500, sector } = req.query;
    const sectorFilter = Array.isArray(sector) ? sector[0] : sector;

    // Fetch from NEPSE API
    const response = await fetch(`${NEPSE_API_BASE}/api/market/todayprice?sort=scrip%20ASC&size=${limit}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`NEPSE API error: ${response.status}`);
    }

    const data = await response.json();

    let stocks = data.data || data || [];

    // Filter by sector if provided
    if (sectorFilter) {
      stocks = stocks.filter((s: any) => 
        s.sector?.toLowerCase() === sectorFilter?.toLowerCase()
      );
    }

    // Format response
    const formattedStocks = stocks.map((s: any) => ({
      symbol: s.symbol || s.scripSymbol || '',
      name: s.companyName || s.company || '',
      lastTradedPrice: parseFloat(s.closePrice || s.lastTradedPrice || 0),
      percentageChange: parseFloat(s.percentageChange || 0),
      volume: parseInt(s.volume || 0),
      openPrice: parseFloat(s.openPrice || 0),
      highPrice: parseFloat(s.highPrice || s.high || 0),
      lowPrice: parseFloat(s.lowPrice || s.low || 0),
      closePrice: parseFloat(s.closePrice || 0),
      sector: s.sector || '',
    }));

    return res.status(200).json(formattedStocks.slice(0, Number(limit)));
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return res.status(500).json({ error: 'Failed to fetch stocks' });
  }
}
