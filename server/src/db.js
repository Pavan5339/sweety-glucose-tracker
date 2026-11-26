import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Return DATE columns as plain 'YYYY-MM-DD' strings so time zones cannot shift them.
pg.types.setTypeParser(1082, (v) => v);

export function createPool(connectionString = process.env.DATABASE_URL) {
  return new pg.Pool({ connectionString, max: Number(process.env.PG_POOL_MAX) || 10 });
}
