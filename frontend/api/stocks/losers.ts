import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './gainers-losers';

export default async function losersHandler(req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
