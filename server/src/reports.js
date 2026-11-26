// Pure helpers for the reports. All dates are 'YYYY-MM-DD' strings.

export function summarize(values) {
  if (values.length === 0) return { count: 0, highest: null, lowest: null, average: null };
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    highest: Math.max(...values),
    lowest: Math.min(...values),
    average: Math.round((sum / values.length) * 10) / 10,
  };
}

const pad = (n) => String(n).padStart(2, '0');
const fmt = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

export function dailyRange(date) {
  return { from: date, to: date };
}

// 1st of the month up to and including the selected date.
export function monthToDateRange(date) {
  const [y, m] = date.split('-').map(Number);
  return { from: fmt(y, m, 1), to: date };
}

// The whole calendar month before the selected date's month.
export function previousMonthRange(date) {
  let [y, m] = date.split('-').map(Number);
  m -= 1;
  if (m === 0) {
    m = 12;
    y -= 1;
  }
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: fmt(y, m, 1), to: fmt(y, m, lastDay) };
}
