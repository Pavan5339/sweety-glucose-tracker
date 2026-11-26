import fs from 'node:fs';
import { createPool } from '../src/db.js';

const sql = fs.readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');
const pool = createPool();
await pool.query(sql);
console.log('Database schema is ready.');
await pool.end();
