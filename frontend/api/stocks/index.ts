import type { VercelRequest, VercelResponse } from '@vercel/node';

const NEPSE_API_BASE = 'https://nepseapi.surajrimal.dev';

// Cache for market data (5 minutes)
let marketCache: {
  stocks: unknown[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

    // Check cache
    if (marketCache && Date.now() - marketCache.timestamp < CACHE_DURATION) {
      let stocks = marketCache.stocks as any[];
      
      if (sectorFilter) {
        stocks = stocks.filter((s: any) => 
          s.sector?.toLowerCase() === sectorFilter?.toLowerCase()
        );
      }
      
      return res.status(200).json(stocks.slice(0, Number(limit)));
    }

    // Fetch from NEPSE API
    const response = await fetch(`${NEPSE_API_BASE}/PriceVolume?limit=500`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`NEPSE API error: ${response.status}`);
    }

    const data = await response.json();
    let stocks = data.data || data || [];

    // Format response
    const formattedStocks = stocks.map((s: any) => ({
      symbol: s.symbol || s.scripSymbol || '',
      name: s.companyName || s.company || '',
      lastTradedPrice: parseFloat(s.closePrice || s.lastTradedPrice || s.price || 0),
      percentageChange: parseFloat(s.percentageChange || 0),
      volume: parseInt(s.volume || 0),
      openPrice: parseFloat(s.openPrice || 0),
      highPrice: parseFloat(s.highPrice || s.high || 0),
      lowPrice: parseFloat(s.lowPrice || s.low || 0),
      closePrice: parseFloat(s.closePrice || 0),
      sector: s.sector || '',
    }));

    // Cache result
    marketCache = {
      stocks: formattedStocks,
      timestamp: Date.now(),
    };

    // Filter by sector if provided
    if (sectorFilter) {
      const filtered = formattedStocks.filter((s: any) => 
        s.sector?.toLowerCase() === sectorFilter?.toLowerCase()
      );
      return res.status(200).json(filtered.slice(0, Number(limit)));
    }

    return res.status(200).json(formattedStocks.slice(0, Number(limit)));
  } catch (error) {
    console.error('Error fetching stocks:', error);
    return res.status(500).json({ error: 'Failed to fetch stocks' });
  }
}
