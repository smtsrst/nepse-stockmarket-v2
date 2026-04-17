import type { VercelRequest, VercelResponse } from '@vercel/node';

const NEPSE_API_BASE = 'https://api.nepseapi.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const response = await fetch(
      `${NEPSE_API_BASE}/api/market/todayprice?sort=scrip%20ASC&size=500`,
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`NEPSE API error: ${response.status}`);
    }

    const data = await response.json();
    const stocks = data.data || data || [];
    const stock = stocks.find(
      (s: any) => (s.symbol || s.scripSymbol || '').toUpperCase() === String(symbol).toUpperCase()
    );

    if (!stock) {
      return res.status(404).json({ error: `Stock ${symbol} not found` });
    }

    return res.status(200).json({
      symbol: stock.symbol || stock.scripSymbol || '',
      name: stock.companyName || stock.company || '',
      lastTradedPrice: parseFloat(stock.closePrice || stock.lastTradedPrice || 0),
      percentageChange: parseFloat(stock.percentageChange || 0),
      volume: parseInt(stock.volume || 0),
      openPrice: parseFloat(stock.openPrice || 0),
      highPrice: parseFloat(stock.highPrice || stock.high || 0),
      lowPrice: parseFloat(stock.lowPrice || stock.low || 0),
      closePrice: parseFloat(stock.closePrice || 0),
      sector: stock.sector || '',
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    return res.status(500).json({ error: 'Failed to fetch stock' });
  }
}
