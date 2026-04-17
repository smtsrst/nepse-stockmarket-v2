import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

let sql = connectionString ? neon(connectionString) : null;

export interface StockPrice {
  id: number;
  symbol: string;
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
  created_at: string | null;
}

export interface Prediction {
  id: number;
  symbol: string;
  prediction: string;
  confidence: number;
  current_price: number;
  predicted_price: number;
  change_percent: number;
  created_at: string;
}

export function isDbConfigured(): boolean {
  return !!sql;
}

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  if (!sql) {
    console.warn('Database not configured');
    throw new Error('Database not configured');
  }
  
  try {
    const result = await sql(text, params);
    return result as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  try {
    const results = await query<T>(text, params);
    return results[0] || null;
  } catch {
    return null;
  }
}
