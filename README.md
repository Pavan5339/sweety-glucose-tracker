# Sweety - Blood Glucose Tracker

A small web app where a patient records up to 4 blood glucose readings a day and views daily, month-to-date and previous-month reports.

Stack: Node.js + Express API, PostgreSQL, React (Vite) frontend.

## Features

- Sign up and log in. Passwords are hashed with bcrypt. Auth uses a JWT sent as a Bearer token. Each user only sees their own readings.
- Add, view, edit and delete readings (date, time slot, value in mg/dl). Slots: Morning (fasting), After breakfast, After lunch, After dinner.
- Validation (shown as clear messages in the UI, enforced on the server, and backed by DB constraints):
  - value required; whole number from 40 to 600
  - one reading per slot per day
  - at most 4 readings per day
  - date cannot be in the future
- Reports with highest, lowest, average (1 decimal) and count, plus a friendly empty state:
  - Daily: the selected date (also lists each reading with its slot)
  - Month to date: 1st of the month up to the selected date
  - Monthly: the whole previous month
- Bonus: pagination on `GET /readings?page=1&limit=20`.

## Project layout

```
server/   Express API, schema (db/schema.sql), migrate and seed scripts, tests
client/   React app (Vite)
.env.example   every variable needed
```

## Setup

You need Node.js 18+ and PostgreSQL 13+.

1. Create the databases (the second one is only for API tests):
   ```
   createdb sweety
   createdb sweety_test
   ```
2. Environment files. Copy the variables from `.env.example`:
   ```
   cp .env.example server/.env      # keep the server variables
   cp .env.example client/.env      # keep VITE_API_URL
   ```
   Edit `DATABASE_URL` and set `JWT_SECRET` to a long random string.
3. Install, create tables and load demo data:
   ```
   cd server
   npm install
   npm run migrate
   npm run seed
   ```
   The seed script creates a demo user with about 200 sample readings over the last 70 days:
   **demo@sweety.test / demo1234**

## Run

```
# terminal 1
cd server && npm start          # http://localhost:4000

# terminal 2
cd client && npm install && npm run dev    # http://localhost:5173
```

## Tests

```
cd server
npm test
```

- `test/validation.test.js`: every validation rule and its message.
- `test/reports.test.js`: highest/lowest/average maths and the date ranges (matches the examples in the brief).
- `test/api.test.js`: register, login, hashed password, user isolation, validation errors, duplicate slot, edit, delete, daily report. It runs only when `TEST_DATABASE_URL` is set. It drops and recreates the tables in that database, so never point it at real data.

## API

| Method | Path | Notes |
| --- | --- | --- |
| POST | /auth/register | name, email, password (min 8 chars) |
| POST | /auth/login | email, password |
| GET | /me | current user |
| GET | /readings | `?page=&limit=` |
| POST | /readings | `{ date, slot, value }` |
| PUT | /readings/:id | same body |
| DELETE | /readings/:id | |
| GET | /reports/daily | `?date=YYYY-MM-DD` (default today) |
| GET | /reports/month-to-date | `?date=` |
| GET | /reports/monthly | `?date=` (previous month of that date) |

## Notes

Assumptions
- "Today" for the future-date check is the server's local date. The browser date picker uses the user's own date.
- The "Monthly" report means the whole calendar month before the selected date's month, as in the brief's example.
- Dates are stored as plain `DATE` values, so there is no time zone shifting.
- The 4-readings-per-day rule is checked in the API with its own message. Because there are exactly 4 slots and one reading per slot, the one-per-slot rule triggers first in normal use; the DB unique constraint is the final guard against races.
- Passwords need at least 8 characters. JWTs last 7 days and are kept in localStorage.

How it was tested
- Unit and API tests above all pass (19 tests). The API tests were run against PGlite (a WebAssembly build of PostgreSQL) in my environment, because a PostgreSQL server was not installable there. The SQL is plain PostgreSQL, but run `npm test` with a real database to confirm.
- The UI was checked in a headless Chrome against the running app, with the seeded demo data (login, reports, validation messages, duplicate slot, adding a reading, narrow mobile view).

What I would improve with more time
- Frontend tests (React Testing Library) for the reading form.
- Charts of readings over the month, and Docker Compose for the database and app.
- Refresh tokens or httpOnly cookies instead of localStorage, and rate limiting on login.
- Better handling of time zones if the server and patient are in different zones.
- Doctor role, Redis caching of reports, reminder jobs.

## AI use

I used an AI assistant (Instinct) to write most of the code, tests and this README, working from the assignment text. I reviewed and ran it, and I can explain the code. Final checks and the decision to submit are mine.
