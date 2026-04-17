import type { VercelRequest, VercelResponse } from '@vercel/node';

const YONEPSE_API = 'https://shubhamnpk.github.io/yonepse/data';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch(`${YONEPSE_API}/market_status.json`);

    if (!response.ok) {
      throw new Error(`YONEPSE API error: ${response.status}`);
    }

    const data = await response.json();

    return res.status(200).json({
      is_open: data.is_open || false,
      message: data.is_open ? 'Market is open' : 'Market is closed',
      last_checked: data.last_checked,
    });
  } catch (error) {
    console.error('Error checking market status:', error);
    return res.status(500).json({ error: 'Failed to check market status' });
  }
}
