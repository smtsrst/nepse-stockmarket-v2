import type { VercelRequest, VercelResponse } from '@vercel/node';
import gainersLosersHandler from '../stocks/gainers-losers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return gainersLosersHandler(req, res);
}
