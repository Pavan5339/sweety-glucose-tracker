// API tests need a PostgreSQL database. They are skipped unless TEST_DATABASE_URL is set.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import request from 'supertest';
import dotenv from 'dotenv';
import { createPool } from '../src/db.js';
import { createApp } from '../src/app.js';
import { todayString } from '../src/validation.js';

dotenv.config();
const url = process.env.TEST_DATABASE_URL;

test('API', { skip: !url && 'set TEST_DATABASE_URL to run API tests' }, async (t) => {
  const pool = createPool(url);
  await pool.query('DROP TABLE IF EXISTS readings; DROP TABLE IF EXISTS users;');
  await pool.query(fs.readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  const app = createApp(pool, { jwtSecret: 'test-secret' });
  const today = todayString();

  const signup = async (email) =>
    (await request(app).post('/auth/register').send({ name: 'Test', email, password: 'password1' })).body.token;
  const tokenA = await signup('a@test.dev');
  const tokenB = await signup('b@test.dev');
  const post = (token, body) => request(app).post('/readings').set('Authorization', `Bearer ${token}`).send(body);

  await t.test('stores a bcrypt hash, not the password', async () => {
    const { rows } = await pool.query("SELECT password_hash FROM users WHERE email = 'a@test.dev'");
    assert.ok(rows[0].password_hash.startsWith('$2'));
    assert.notEqual(rows[0].password_hash, 'password1');
  });

  await t.test('login works and rejects a wrong password', async () => {
    const good = await request(app).post('/auth/login').send({ email: 'a@test.dev', password: 'password1' });
    assert.equal(good.status, 200);
    const bad = await request(app).post('/auth/login').send({ email: 'a@test.dev', password: 'wrong' });
    assert.equal(bad.status, 401);
  });

  await t.test('readings need a login', async () => {
    assert.equal((await request(app).get('/readings')).status, 401);
  });

  await t.test('validation errors and duplicate slot', async () => {
    assert.equal((await post(tokenA, { date: today, slot: 'morning', value: 20 })).body.error, 'Value must be between 40 and 600 mg/dl.');
    assert.equal((await post(tokenA, { date: today, slot: 'morning', value: 100 })).status, 201);
    const dup = await post(tokenA, { date: today, slot: 'morning', value: 110 });
    assert.equal(dup.status, 400);
    assert.equal(dup.body.error, 'You already have a Morning (fasting) reading for this date.');
  });

  await t.test('users only see their own readings', async () => {
    const a = await request(app).get('/readings').set('Authorization', `Bearer ${tokenA}`);
    const b = await request(app).get('/readings').set('Authorization', `Bearer ${tokenB}`);
    assert.equal(a.body.total, 1);
    assert.equal(b.body.total, 0);
  });

  await t.test('edit and delete', async () => {
    const created = await post(tokenA, { date: today, slot: 'after_lunch', value: 130 });
    const put = await request(app).put(`/readings/${created.body.id}`).set('Authorization', `Bearer ${tokenA}`).send({ date: today, slot: 'after_lunch', value: 150 });
    assert.equal(put.body.value, 150);
    const other = await request(app).delete(`/readings/${created.body.id}`).set('Authorization', `Bearer ${tokenB}`);
    assert.equal(other.status, 404);
    const del = await request(app).delete(`/readings/${created.body.id}`).set('Authorization', `Bearer ${tokenA}`);
    assert.equal(del.status, 204);
  });

  await t.test('daily report', async () => {
    await post(tokenA, { date: today, slot: 'after_dinner', value: 141 });
    const res = await request(app).get(`/reports/daily?date=${today}`).set('Authorization', `Bearer ${tokenA}`);
    assert.equal(res.body.count, 2);
    assert.equal(res.body.highest, 141);
    assert.equal(res.body.lowest, 100);
    assert.equal(res.body.average, 120.5);
    assert.equal(res.body.readings.length, 2);
    const empty = await request(app).get(`/reports/daily?date=${today}`).set('Authorization', `Bearer ${tokenB}`);
    assert.equal(empty.body.count, 0);
  });

  await pool.end();
});
