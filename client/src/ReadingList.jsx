import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

export default function ReadingList({ refreshKey, onEdit, onChanged }) {
  const [data, setData] = useState({ readings: [], total: 0, page: 1, limit: 10 });
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await api(`/readings?page=${page}&limit=10`));
    } catch (err) {
      setError(err.message);
    }
  }, [page]);

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
      <h2>Your readings</h2>
      {error && <p className="error" role="alert">{error}</p>}
      {data.readings.length === 0 ? (
        <p className="muted">No readings yet. Add your first one above.</p>
      ) : (
        <table>
          <thead>
            <tr><th>Date</th><th>Slot</th><th>mg/dl</th><th></th></tr>
          </thead>
          <tbody>
            {data.readings.map((r) => (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td>{r.slotLabel}</td>
                <td>{r.value}</td>
                <td className="actions">
                  <button className="link" onClick={() => onEdit(r)}>Edit</button>
                  <button className="link danger" onClick={() => remove(r)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {pages > 1 && (
        <div className="row pager">
          <button className="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span className="muted">Page {page} of {pages}</span>
          <button className="secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
