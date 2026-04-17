import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check if market is open (NEPSE hours: 10:00 AM - 3:00 PM NPT, Sunday-Thursday)
    const now = new Date();
    
    // Convert to Nepal time (UTC+5:45)
    const nepalOffset = 5 * 60 + 45;
    const nepalTime = new Date(now.getTime() + nepalOffset * 60 * 1000);
    
    const hour = nepalTime.getUTCHours();
    const day = nepalTime.getUTCDay();
    
    // NEPSE is open Sunday-Thursday (0 = Sunday, 4 = Thursday)
    const isWeekday = day >= 0 && day <= 4;
    const isMarketHours = hour >= 10 && hour < 15;
    
    const isOpen = isWeekday && isMarketHours;

    return res.status(200).json({
      is_open: isOpen,
      message: isOpen ? 'Market is open' : 'Market is closed',
      nepal_time: nepalTime.toISOString(),
    });
  } catch (error) {
    console.error('Error checking market status:', error);
    return res.status(500).json({ error: 'Failed to check market status' });
  }
}
