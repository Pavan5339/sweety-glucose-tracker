import { useEffect, useState } from 'react';
import { api, SLOTS, todayString } from './api.js';

export default function ReadingForm({ editing, onSaved, onCancel }) {
  const empty = { date: todayString(), slot: 'morning', value: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setErrors({});
    setForm(editing ? { date: editing.date, slot: editing.slot, value: String(editing.value) } : empty);
  }, [editing]);

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  function validate(data) {
    const errs = {};
    if (!data.date) {
      errs.date = 'Please choose a valid date.';
    } else if (data.date > todayString()) {
      errs.date = 'Date cannot be in the future.';
    }

    if (!data.slot) {
      errs.slot = 'Please choose a time slot.';
    }

    if (data.value === undefined || data.value === null || String(data.value).trim() === '') {
      errs.value = 'Please enter a glucose value.';
    } else {
      const num = Number(data.value);
      if (!Number.isInteger(num) || num < 40 || num > 600) {
        errs.value = 'Value must be between 40 and 600 mg/dl.';
      }
    }
    return errs;
  }

  async function submit(e) {
    e.preventDefault();
    const clientErrs = validate(form);
    if (Object.keys(clientErrs).length > 0) {
      setErrors(clientErrs);
      return;
    }
    setErrors({});
    try {
      const body = { ...form, value: Number(form.value) };
      if (editing) await api(`/readings/${editing.id}`, { method: 'PUT', body });
      else await api('/readings', { method: 'POST', body });
      setForm({ ...empty, date: form.date });
      onSaved(form.date);
    } catch (err) {
      const msg = err.message || 'Something went wrong.';
      if (msg.includes('reading for this date') || msg.includes('slot')) {
        setErrors({ slot: msg });
      } else if (msg.includes('Date') || msg.includes('date')) {
        setErrors({ date: msg });
      } else if (msg.includes('glucose') || msg.includes('Value')) {
        setErrors({ value: msg });
      } else {
        setErrors({ general: msg });
      }
    }
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        {editing ? 'Edit reading' : 'Add a reading'}
      </h2>

      {errors.general && <p className="error" role="alert">{errors.general}</p>}

      <div className="row">
        <label>
          Date
          {errors.date && <span className="field-error" role="alert">{errors.date}</span>}
          <input type="date" value={form.date} max={todayString()} onChange={set('date')} aria-label="Date" />
        </label>
        <label>
          Time slot
          {errors.slot && <span className="field-error" role="alert">{errors.slot}</span>}
          <select value={form.slot} onChange={set('slot')} aria-label="Time slot">
            {SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label>
          Glucose value (mg/dl)
          {errors.value && <span className="field-error" role="alert">{errors.value}</span>}
          <input inputMode="numeric" value={form.value} onChange={set('value')} placeholder="e.g. 110" aria-label="Glucose value" />
        </label>
      </div>

      <div className="row" style={{ marginTop: '16px' }}>
        <button>{editing ? 'Save changes' : 'Add reading'}</button>
        {editing && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
