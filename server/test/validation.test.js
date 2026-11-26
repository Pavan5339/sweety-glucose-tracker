import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReadingInput, duplicateSlotMessage, isValidDateString } from '../src/validation.js';

const TODAY = '2026-10-15';
const ok = { date: '2026-10-15', slot: 'morning', value: 100 };

test('accepts a valid reading', () => {
  assert.equal(validateReadingInput(ok, TODAY), null);
  assert.equal(validateReadingInput({ ...ok, value: '120' }, TODAY), null);
});

test('value is required', () => {
  for (const value of [undefined, null, '']) {
    assert.equal(validateReadingInput({ ...ok, value }, TODAY), 'Please enter a glucose value.');
  }
});

test('value must be a whole number between 40 and 600', () => {
  const msg = 'Value must be between 40 and 600 mg/dl.';
  for (const value of [39, 601, 100.5, 'abc', -5]) {
    assert.equal(validateReadingInput({ ...ok, value }, TODAY), msg);
  }
  assert.equal(validateReadingInput({ ...ok, value: 40 }, TODAY), null);
  assert.equal(validateReadingInput({ ...ok, value: 600 }, TODAY), null);
});

test('date cannot be in the future', () => {
  assert.equal(validateReadingInput({ ...ok, date: '2026-10-16' }, TODAY), 'Date cannot be in the future.');
  assert.equal(validateReadingInput({ ...ok, date: '2026-10-14' }, TODAY), null);
});

test('rejects bad dates and unknown slots', () => {
  assert.equal(isValidDateString('2026-02-30'), false);
  assert.equal(isValidDateString('2026-02-28'), true);
  assert.ok(validateReadingInput({ ...ok, date: 'nope' }, TODAY));
  assert.ok(validateReadingInput({ ...ok, slot: 'midnight' }, TODAY));
});

test('duplicate slot message names the slot', () => {
  assert.equal(duplicateSlotMessage('after_lunch'), 'You already have an After lunch reading for this date.');
});

test('duplicate slot message uses a/an correctly', () => {
  assert.equal(duplicateSlotMessage('morning'), 'You already have a Morning (fasting) reading for this date.');
  assert.equal(duplicateSlotMessage('after_dinner'), 'You already have an After dinner reading for this date.');
});
