export const SLOTS = {
  morning: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

export const MAX_PER_DAY = 4;

// Today as YYYY-MM-DD in the server's local time zone.
export function todayString(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isValidDateString(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// Field-level checks that need no database. Returns an error message or null.
export function validateReadingInput({ date, slot, value }, today = todayString()) {
  if (value === undefined || value === null || value === '') return 'Please enter a glucose value.';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(n) || n < 40 || n > 600) return 'Value must be between 40 and 600 mg/dl.';
  if (!isValidDateString(date)) return 'Please choose a valid date.';
  if (date > today) return 'Date cannot be in the future.';
  if (!Object.prototype.hasOwnProperty.call(SLOTS, slot)) return 'Please choose a time slot.';
  return null;
}

export function duplicateSlotMessage(slot) {
  const label = SLOTS[slot];
  const article = /^[AEIOU]/.test(label) ? 'an' : 'a';
  return `You already have ${article} ${label} reading for this date.`;
}

export const MAX_PER_DAY_MESSAGE = 'You can add only 4 readings per day.';
