import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

function getGlucoseClass(val) {
  if (val < 70) return 'val-low';
  if (val <= 140) return 'val-normal';
  if (val <= 180) return 'val-elevated';
  return 'val-high';
}

export default function ReadingList({ refreshKey, onEdit, onChanged, patientId, readOnly = false }) {
  const [data, setData] = useState({ readings: [], total: 0, page: 1, limit: 20 });
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const endpoint = patientId
        ? `/doctor/patients/${patientId}/readings?page=${page}&limit=20`
        : `/readings?page=${page}&limit=20`;
      setData(await api(endpoint));
    } catch (err) {
      setError(err.message);
    }
  }, [page, patientId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  async function remove(r) {
    if (!window.confirm(`Delete the ${r.slotLabel} reading on ${r.date}?`)) return;
    try {
      await api(`/readings/${r.id}`, { method: 'DELETE' });
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  const pages = Math.max(Math.ceil(data.total / data.limit), 1);

  return (
    <div className="card">
      <div className="row between">
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          {readOnly ? "Patient's Glucose Log" : 'Your Glucose Diary'}
        </h2>
        <span className="badge patient" style={{ fontSize: '0.78rem' }}>
          {data.total} recorded {data.total === 1 ? 'reading' : 'readings'}
        </span>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {data.readings.length === 0 ? (
        <p className="empty">
          {readOnly ? 'No readings recorded for this patient yet.' : 'No readings logged yet. Record your first one above.'}
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time Slot</th>
              <th>Glucose Value</th>
              {!readOnly && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.readings.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600, color: '#334155' }}>{r.date}</td>
                <td>
                  <span className={`slot-badge slot-${r.slot}`}>
                    {r.slotLabel}
                  </span>
                </td>
                <td>
                  <span className={`val-badge ${getGlucoseClass(r.value)}`}>
                    {r.value} mg/dl
                  </span>
                </td>
                {!readOnly && (
                  <td className="actions">
                    <button className="link" onClick={() => onEdit(r)} style={{ marginRight: '4px' }}>
                      Edit
                    </button>
                    <button className="link danger" onClick={() => remove(r)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {pages > 1 && (
        <div className="row pager">
          <button className="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Previous
          </button>
          <span className="muted" style={{ fontWeight: 600 }}>
            Page {page} of {pages}
          </span>
          <button className="secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
