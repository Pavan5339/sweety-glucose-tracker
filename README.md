# Sweety - Blood Glucose Tracker (MERN + PostgreSQL)

A responsive web application where diabetes patients record up to 4 blood glucose readings a day and view daily, month-to-date, and previous-month reports. Built with a Node.js + Express API, PostgreSQL database, and React (Vite) frontend.

---

## Features

### 1. Authentication & Security
- **Registration & Login**: Secure sign-up and login with name, email, and password (minimum 8 characters).
- **Password Security**: Passwords are hashed using `bcrypt` (10 rounds); plain-text passwords are never stored.
- **JWT Authorization**: Session managed via JSON Web Tokens sent in standard `Bearer` authorization headers.
- **User Isolation**: Patients can only see and modify their own glucose readings.
- **Role-based Access Control**: Supports both `patient` and `doctor` roles.

### 2. Readings Management & Form Validation
- **Readings**: Date, time slot, and glucose value in mg/dl.
- **Time Slots**:
  - `morning`: Morning (fasting)
  - `after_breakfast`: After breakfast
  - `after_lunch`: After lunch
  - `after_dinner`: After dinner
- **Validation Rules & Clear UI Error Messages (displayed directly above each input field)**:
  - **Value required**: *"Please enter a glucose value."*
  - **Whole number between 40 and 600**: *"Value must be between 40 and 600 mg/dl."*
  - **Only one reading per slot per day**: *"You already have an After lunch reading for this date."* (dynamic slot name)
  - **Maximum 4 readings per day**: *"You can add only 4 readings per day."*
  - **Date cannot be in the future**: *"Date cannot be in the future."*
- Full CRUD: Add, view with pagination, inline edit, and delete readings.

### 3. Reports
- Computes **Highest**, **Lowest**, **Average** (rounded to 1 decimal place), and **Reading Count** for three standard periods:
  - **Daily**: The selected date (includes list of individual readings with time slots).
  - **Month to date**: From the 1st of the month up to the selected date.
  - **Monthly (Previous Month)**: The entire previous calendar month (e.g., if selected date is in October, range is 1 Sep – 30 Sep).
- Friendly empty state when no readings exist for a chosen period.

---

## Bonus Tasks Implemented

1. **Interactive Charts (Recharts)**:
   - Visual trend line chart displaying glucose readings over the month (supports both Month-to-Date and Previous Month views).
   - Target glucose reference lines (Normal target threshold between 70 and 180 mg/dl).
   - Slot-based filtering and interactive hover tooltips.
2. **Docker & Docker Compose**:
   - `docker-compose.yml` orchestrates PostgreSQL 15, backend Express API, and React frontend with a single command.
3. **Frontend Tests with React Testing Library**:
   - Automated component test suite (`client/src/__tests__/ReadingForm.test.jsx`) powered by Vitest and React Testing Library verifying field-level validation, input rendering, API error mapping, and submission.
4. **Pagination**:
   - Efficient pagination on `GET /readings?page=1&limit=20` with next/previous controls and total count.
5. **Doctor Role**:
   - Dedicated Doctor Portal for doctor accounts (`role: 'doctor'`).
   - Doctors can view assigned patients, their glucose reports, visual trend charts, and readings history in read-only mode with patient isolation.

---

## Demo Accounts

The database seed script populates 70 days of sample readings (~224 records) and sets up demo credentials:

| Role | Email | Password | Access |
| --- | --- | --- | --- |
| **Patient** | `demo@sweety.test` | `demo1234` | Full patient tracking & reporting |
| **Doctor** | `doctor@sweety.test` | `doctor1234` | Doctor Portal viewing assigned patients |

---

## Quick Start with Docker

Run the complete stack (PostgreSQL + API Server + Client) with Docker Compose:

```bash
docker compose up --build
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **PostgreSQL**: localhost:5432

---

## Local Setup (Without Docker)

### Prerequisites
- Node.js 18+
- PostgreSQL 13+

### 1. Create PostgreSQL Databases
```bash
createdb sweety
createdb sweety_test
```

### 2. Configure Environment Files
Copy the example variables:
```bash
cp .env.example server/.env
cp .env.example client/.env
```
Ensure `DATABASE_URL` in `server/.env` points to your local PostgreSQL instance (e.g., `postgres://postgres:postgres@localhost:5432/sweety`).

### 3. Install Dependencies & Seed Demo Data
```bash
# Server setup, migrations, and seed
cd server
npm install
npm run migrate
npm run seed

# Client setup
cd ../client
npm install
```

### 4. Run the Application
In separate terminals:

```bash
# Terminal 1 - Backend Server (http://localhost:4000)
cd server
npm start

# Terminal 2 - Frontend App (http://localhost:5173)
cd client
npm run dev
```

---

## Running Automated Tests

### Backend Test Suite (Node test runner + Supertest)
```bash
cd server
npm test
```
*Executes 20 tests covering authentication, password hashing, validation rules, error messages, user isolation, reports calculations, and doctor role access.*

### Frontend Test Suite (Vitest + React Testing Library)
```bash
cd client
npm test
```
*Executes component tests for `ReadingForm` verifying required value, range enforcement (40-600), future date prevention, and error message rendering.*

---

## API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Register a new patient or doctor account |
| `POST` | `/auth/login` | Authenticate and obtain JWT token |
| `GET` | `/me` | Get currently authenticated user profile |
| `GET` | `/readings?page=1&limit=20` | Paginated readings for logged-in user |
| `POST` | `/readings` | Add reading `{ date, slot, value }` |
| `PUT` | `/readings/:id` | Update an existing reading |
| `DELETE` | `/readings/:id` | Delete a reading |
| `GET` | `/reports/daily?date=YYYY-MM-DD` | Daily report with individual readings |
| `GET` | `/reports/month-to-date?date=YYYY-MM-DD` | 1st of month to selected date |
| `GET` | `/reports/monthly?date=YYYY-MM-DD` | Complete previous calendar month |
| `GET` | `/doctor/patients` | (Doctor only) List assigned patients |
| `GET` | `/doctor/patients/:id/reports/:type` | (Doctor only) Patient's reports |
| `GET` | `/doctor/patients/:id/readings` | (Doctor only) Patient's readings |

---

## Notes & Technical Assumptions

1. **Date & Time Zones**:
   - Dates are strictly stored and parsed as ISO `YYYY-MM-DD` (`DATE` type in PostgreSQL) to prevent timezone drift across client and server.
   - The future-date validation check evaluates against the current server date in local time.
2. **Constraint Enforcement**:
   - Multi-layer defense: Client-side validation validates inputs instantly, the Express API enforces all business logic, and PostgreSQL unique indexes (`UNIQUE (user_id, reading_date, slot)`) and check constraints guarantee data integrity against race conditions.
3. **Monthly Report Definition**:
   - In accordance with the assignment brief, "Monthly" calculates stats across the entire previous calendar month relative to the selected date (e.g. 1 Sep – 30 Sep for an October date).
