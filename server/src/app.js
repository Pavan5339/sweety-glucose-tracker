import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  SLOTS,
  MAX_PER_DAY,
  MAX_PER_DAY_MESSAGE,
  duplicateSlotMessage,
  isValidDateString,
  todayString,
  validateReadingInput,
} from './validation.js';
import { dailyRange, monthToDateRange, previousMonthRange, summarize } from './reports.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createApp(pool, { jwtSecret = process.env.JWT_SECRET || 'dev-secret' } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const sign = (user) => jwt.sign({ id: user.id }, jwtSecret, { expiresIn: '7d' });

  function auth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Please log in.' });
    try {
      req.userId = jwt.verify(token, jwtSecret).id;
      next();
    } catch {
      res.status(401).json({ error: 'Your session has expired. Please log in again.' });
    }
  }

  const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

  app.get('/health', (req, res) => res.json({ ok: true }));

  app.post('/auth/register', wrap(async (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Please enter your name.' });
    if (!EMAIL_RE.test(String(email || ''))) return res.status(400).json({ error: 'Please enter a valid email.' });
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    const normalized = String(email).trim().toLowerCase();
    const hash = await bcrypt.hash(password, 10);
    try {
      const { rows } = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
        [String(name).trim(), normalized, hash]
      );
      res.status(201).json({ token: sign(rows[0]), user: rows[0] });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'An account with this email already exists.' });
      throw err;
    }
  }));

  app.post('/auth/login', wrap(async (req, res) => {
    const { email, password } = req.body || {};
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [String(email || '').trim().toLowerCase()]);
    const user = rows[0];
    const ok = user && typeof password === 'string' && (await bcrypt.compare(password, user.password_hash));
    if (!ok) return res.status(401).json({ error: 'Incorrect email or password.' });
    res.json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email } });
  }));

  app.get('/me', auth, wrap(async (req, res) => {
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.userId]);
    if (!rows[0]) return res.status(401).json({ error: 'Please log in.' });
    res.json(rows[0]);
  }));

  // Checks that need the database: one reading per slot per day, max 4 per day.
  async function checkDay(userId, { date, slot }, excludeId = null) {
    const { rows } = await pool.query(
      'SELECT id, slot FROM readings WHERE user_id = $1 AND reading_date = $2 AND ($3::int IS NULL OR id <> $3)',
      [userId, date, excludeId]
    );
    if (rows.some((r) => r.slot === slot)) return duplicateSlotMessage(slot);
    if (rows.length >= MAX_PER_DAY) return MAX_PER_DAY_MESSAGE;
    return null;
  }

  const toDto = (r) => ({ id: r.id, date: r.reading_date, slot: r.slot, slotLabel: SLOTS[r.slot], value: r.value });

  app.get('/readings', auth, wrap(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const total = (await pool.query('SELECT count(*)::int AS n FROM readings WHERE user_id = $1', [req.userId])).rows[0].n;
    const { rows } = await pool.query(
      `SELECT * FROM readings WHERE user_id = $1
       ORDER BY reading_date DESC,
         array_position(ARRAY['morning','after_breakfast','after_lunch','after_dinner'], slot)
       LIMIT $2 OFFSET $3`,
      [req.userId, limit, (page - 1) * limit]
    );
    res.json({ page, limit, total, readings: rows.map(toDto) });
  }));

  app.post('/readings', auth, wrap(async (req, res) => {
    const input = req.body || {};
    const err = validateReadingInput(input) || (await checkDay(req.userId, input));
    if (err) return res.status(400).json({ error: err });
    try {
      const { rows } = await pool.query(
        'INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4) RETURNING *',
        [req.userId, input.date, input.slot, Number(input.value)]
      );
      res.status(201).json(toDto(rows[0]));
    } catch (e) {
      if (e.code === '23505') return res.status(400).json({ error: duplicateSlotMessage(input.slot) });
      throw e;
    }
  }));

  app.put('/readings/:id', auth, wrap(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const input = req.body || {};
    const existing = Number.isInteger(id)
      ? (await pool.query('SELECT id FROM readings WHERE id = $1 AND user_id = $2', [id, req.userId])).rows[0]
      : null;
    if (!existing) return res.status(404).json({ error: 'Reading not found.' });
    const err = validateReadingInput(input) || (await checkDay(req.userId, input, id));
    if (err) return res.status(400).json({ error: err });
    try {
      const { rows } = await pool.query(
        'UPDATE readings SET reading_date = $1, slot = $2, value = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
        [input.date, input.slot, Number(input.value), id, req.userId]
      );
      res.json(toDto(rows[0]));
    } catch (e) {
      if (e.code === '23505') return res.status(400).json({ error: duplicateSlotMessage(input.slot) });
      throw e;
    }
  }));

  app.delete('/readings/:id', auth, wrap(async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = Number.isInteger(id)
      ? await pool.query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [id, req.userId])
      : { rowCount: 0 };
    if (!result.rowCount) return res.status(404).json({ error: 'Reading not found.' });
    res.status(204).end();
  }));

  async function report(userId, range, withReadings) {
    const { rows } = await pool.query(
      `SELECT * FROM readings WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
       ORDER BY reading_date,
         array_position(ARRAY['morning','after_breakfast','after_lunch','after_dinner'], slot)`,
      [userId, range.from, range.to]
    );
    const out = { ...range, ...summarize(rows.map((r) => r.value)) };
    if (withReadings) out.readings = rows.map(toDto);
    return out;
  }

  function reportRoute(path, rangeFn, withReadings) {
    app.get(path, auth, wrap(async (req, res) => {
      const date = req.query.date || todayString();
      if (!isValidDateString(date)) return res.status(400).json({ error: 'Please choose a valid date.' });
      res.json(await report(req.userId, rangeFn(date), withReadings));
    }));
  }
  reportRoute('/reports/daily', dailyRange, true);
  reportRoute('/reports/month-to-date', monthToDateRange, false);
  reportRoute('/reports/monthly', previousMonthRange, false);

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });

  return app;
}
