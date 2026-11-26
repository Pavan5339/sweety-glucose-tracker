import { useEffect, useState } from 'react';
import { api, todayString } from './api.js';

function Stats({ title, report }) {
  return (
    <div className="report">
      <h3>{title}</h3>
      {report && <p className="muted">{report.from === report.to ? report.from : `${report.from} to ${report.to}`}</p>}
      {!report ? null : report.count === 0 ? (
        <p className="empty">No readings in this period yet.</p>
      ) : (
        <dl>
          <div><dt>Highest</dt><dd>{report.highest}</dd></div>
          <div><dt>Lowest</dt><dd>{report.lowest}</dd></div>
          <div><dt>Average</dt><dd>{report.average.toFixed(1)}</dd></div>
          <div><dt>Readings</dt><dd>{report.count}</dd></div>
        </dl>
      )}
    </div>
  );
}

export default function Reports({ date, onDateChange, refreshKey }) {
  const [reports, setReports] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    Promise.all([
      api(`/reports/daily?date=${date}`),
      api(`/reports/month-to-date?date=${date}`),
      api(`/reports/monthly?date=${date}`),
    ])
      .then(([daily, mtd, monthly]) => !cancelled && setReports({ daily, mtd, monthly }))
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, [date, refreshKey]);

  const daily = reports.daily;

  return (
    <div className="card">
      <div className="row between">
        <h2>Reports</h2>
        <label className="inline">
          Selected date
          <input type="date" value={date} max={todayString()} onChange={(e) => e.target.value && onDateChange(e.target.value)} />
        </label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="reports">
        <Stats title="Daily" report={daily} />
        <Stats title="Month to date" report={reports.mtd} />
        <Stats title="Previous month" report={reports.monthly} />
      </div>
      {daily && daily.count > 0 && (
        <>
          <h3>Readings on {daily.from}</h3>
          <ul className="plain">
            {daily.readings.map((r) => (
              <li key={r.id}>{r.slotLabel}: <strong>{r.value}</strong> mg/dl</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
