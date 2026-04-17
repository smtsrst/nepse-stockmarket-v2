import type { VercelRequest, VercelResponse } from '@vercel/node';

const YONEPSE_API = 'https://shubhamnpk.github.io/yonepse/data';

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

    // Fetch from YONEPSE API
    const response = await fetch(`${YONEPSE_API}/nepse_data.json`);

    if (!response.ok) {
      throw new Error(`YONEPSE API error: ${response.status}`);
    }

    const data = await response.json();
    let stocks = data || [];

    // Format response to match our interface
    const formattedStocks = stocks.map((s: any) => ({
      symbol: s.symbol || '',
      name: s.name || '',
      lastTradedPrice: parseFloat(s.ltp || 0),
      percentageChange: parseFloat(s.percent_change || 0),
      volume: parseInt(s.volume || 0),
      openPrice: parseFloat(s.ltp || 0) - parseFloat(s.change || 0),
      highPrice: parseFloat(s.high || 0),
      lowPrice: parseFloat(s.low || 0),
      closePrice: parseFloat(s.ltp || 0),
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
