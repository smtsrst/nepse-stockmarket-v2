import type { VercelRequest, VercelResponse } from '@vercel/node';

const NEPSE_API_BASE = 'https://nepseapi.surajrimal.dev';

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

    const response = await fetch(`${NEPSE_API_BASE}/Summary`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`NEPSE API error: ${response.status}`);
    }

    const data = await response.json();
    const summaryData = data.data || data || {};

    // Format summary (adjust based on actual API response structure)
    const summary = {
      total_turnover: parseFloat(summaryData.totalTurnover || summaryData.turnover || 0),
      total_trade: parseInt(summaryData.totalTransactions || summaryData.trade || 0),
      total_share: parseInt(summaryData.totalShares || summaryData.share || 0),
      total_companies: parseInt(summaryData.totalCompanies || summaryData.companies || 0),
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
