import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

export function isDbConfigured(): boolean {
  return !!connectionString;
}

export function getSql() {
  if (!connectionString) {
    throw new Error('Database not configured');
  }
  return neon(connectionString);
}

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const sql = getSql();
  const paramArray = params || [];

  let result: any;
  if (paramArray.length === 0) {
    result = await sql`${text}`;
  } else if (paramArray.length === 1) {
    result = await sql`SELECT * FROM (${text}) AS sub WHERE 1=1`.catch(() => {
      let q = text;
      q = q.replace('$1', typeof paramArray[0] === 'string' ? `'${paramArray[0]}'` : String(paramArray[0]));
      return sql`${q}`;
    });
  } else {
    let q = text;
    paramArray.forEach((p, i) => {
      q = q.replace(`$${i + 1}`, typeof p === 'string' ? `'${p}'` : String(p));
    });
    result = await sql`${q}`;
  }

  return result as T[];
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const results = await query<T>(text, params);
  return results[0] || null;
}
