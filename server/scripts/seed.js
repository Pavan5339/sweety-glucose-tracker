import bcrypt from 'bcrypt';
import { createPool } from '../src/db.js';
import { todayString } from '../src/validation.js';

const SLOTS = ['morning', 'after_breakfast', 'after_lunch', 'after_dinner'];
const EMAIL = 'demo@sweety.test';
const PASSWORD = 'demo1234';

const DOCTOR_EMAIL = 'doctor@sweety.test';
const DOCTOR_PASSWORD = 'doctor1234';

const pool = createPool();
const hash = await bcrypt.hash(PASSWORD, 10);
const { rows } = await pool.query(
  `INSERT INTO users (name, email, password_hash, role) VALUES ('Demo Patient', $1, $2, 'patient')
   ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'patient' RETURNING id`,
  [EMAIL, hash]
);
const userId = rows[0].id;
await pool.query('DELETE FROM readings WHERE user_id = $1', [userId]);

// Create demo doctor account
const docHash = await bcrypt.hash(DOCTOR_PASSWORD, 10);
const { rows: docRows } = await pool.query(
  `INSERT INTO users (name, email, password_hash, role) VALUES ('Dr. Smith', $1, $2, 'doctor')
   ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'doctor' RETURNING id`,
  [DOCTOR_EMAIL, docHash]
);
const doctorId = docRows[0].id;

// Assign Demo Patient to Dr. Smith
await pool.query(
  `INSERT INTO doctor_patient_assignments (doctor_id, patient_id) VALUES ($1, $2)
   ON CONFLICT (doctor_id, patient_id) DO NOTHING`,
  [doctorId, userId]
);

// Sample readings for the last 70 days (covers this month and the whole previous month).
// Values follow a fixed pattern so the demo data is the same every run.
const base = { morning: 98, after_breakfast: 142, after_lunch: 135, after_dinner: 128 };
const today = new Date();
let inserted = 0;
for (let i = 0; i < 70; i++) {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
  const date = todayString(d);
  for (let s = 0; s < SLOTS.length; s++) {
    if ((i + s) % 5 === 0) continue; // leave some slots empty so days look realistic
    const value = base[SLOTS[s]] + ((i * 7 + s * 13) % 31) - 12;
    await pool.query('INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)', [userId, date, SLOTS[s], value]);
    inserted++;
  }
}
console.log(`Seeded ${inserted} readings. Patient: ${EMAIL} / ${PASSWORD} | Doctor: ${DOCTOR_EMAIL} / ${DOCTOR_PASSWORD}`);
await pool.end();
