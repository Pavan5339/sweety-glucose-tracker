import { useEffect, useState } from 'react';
import { api, SLOTS, todayString } from './api.js';

export default function ReadingForm({ editing, onSaved, onCancel }) {
  const empty = { date: todayString(), slot: 'morning', value: '' };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    setForm(editing ? { date: editing.date, slot: editing.slot, value: String(editing.value) } : empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const body = { ...form, value: form.value === '' ? '' : Number(form.value) };
      if (editing) await api(`/readings/${editing.id}`, { method: 'PUT', body });
      else await api('/readings', { method: 'POST', body });
      setForm({ ...empty, date: form.date });
      onSaved(form.date);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2>{editing ? 'Edit reading' : 'Add a reading'}</h2>
      <div className="row">
        <label>
          Date
          <input type="date" value={form.date} max={todayString()} onChange={set('date')} />
        </label>
        <label>
          Time slot
          <select value={form.slot} onChange={set('slot')}>
            {SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label>
          Glucose (mg/dl)
          <input inputMode="numeric" value={form.value} onChange={set('value')} placeholder="e.g. 110" />
        </label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row">
        <button>{editing ? 'Save changes' : 'Add reading'}</button>
        {editing && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
