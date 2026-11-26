import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize, dailyRange, monthToDateRange, previousMonthRange } from '../src/reports.js';

test('summarize returns highest, lowest, average (1 decimal) and count', () => {
  assert.deepEqual(summarize([100, 120, 141]), { count: 3, highest: 141, lowest: 100, average: 120.3 });
});

test('summarize handles no readings', () => {
  assert.deepEqual(summarize([]), { count: 0, highest: null, lowest: null, average: null });
});

test('ranges match the assignment examples (selected date 15 Oct 2026)', () => {
  assert.deepEqual(dailyRange('2026-10-15'), { from: '2026-10-15', to: '2026-10-15' });
  assert.deepEqual(monthToDateRange('2026-10-15'), { from: '2026-10-01', to: '2026-10-15' });
  assert.deepEqual(previousMonthRange('2026-10-15'), { from: '2026-09-01', to: '2026-09-30' });
});

test('previous month handles January and leap years', () => {
  assert.deepEqual(previousMonthRange('2027-01-10'), { from: '2026-12-01', to: '2026-12-31' });
  assert.deepEqual(previousMonthRange('2028-03-05'), { from: '2028-02-01', to: '2028-02-29' });
});
