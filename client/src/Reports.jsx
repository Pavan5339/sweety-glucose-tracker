import { useEffect, useState } from 'react';
import { api, todayString } from './api.js';
import ReadingsChart from './ReadingsChart.jsx';

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
          <div><dt>Average</dt><dd>{report.average?.toFixed(1) ?? '-'}</dd></div>
          <div><dt>Readings</dt><dd>{report.count}</dd></div>
        </dl>
      )}
    </div>
  );
}

export default function Reports({ date, onDateChange, refreshKey, patientId }) {
  const [reports, setReports] = useState({});
  const [error, setError] = useState('');
  const [chartPeriod, setChartPeriod] = useState('mtd');

  useEffect(() => {
    let cancelled = false;
    setError('');
    const basePath = patientId ? `/doctor/patients/${patientId}/reports` : '/reports';
    Promise.all([
      api(`${basePath}/daily?date=${date}`),
      api(`${basePath}/month-to-date?date=${date}&includeReadings=true`),
      api(`${basePath}/monthly?date=${date}&includeReadings=true`),
    ])
      .then(([daily, mtd, monthly]) => !cancelled && setReports({ daily, mtd, monthly }))
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, [date, refreshKey, patientId]);

  const daily = reports.daily;
  const activeChartData = chartPeriod === 'mtd' ? reports.mtd?.readings : reports.monthly?.readings;
  const activeChartTitle = chartPeriod === 'mtd' ? 'Month-to-Date Glucose Trend' : 'Previous Month Glucose Trend';

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

      {/* Recharts Line Chart Bonus Feature */}
      <div style={{ marginTop: '16px' }}>
        <div className="row between" style={{ alignItems: 'center', marginBottom: '4px' }}>
          <h3 style={{ margin: 0 }}>Visual Trend</h3>
          <div className="row" style={{ gap: '6px' }}>
            <button
              type="button"
              className={chartPeriod === 'mtd' ? '' : 'secondary'}
              style={{ padding: '4px 10px', fontSize: '0.85rem' }}
              onClick={() => setChartPeriod('mtd')}
            >
              Month to Date
            </button>
            <button
              type="button"
              className={chartPeriod === 'monthly' ? '' : 'secondary'}
              style={{ padding: '4px 10px', fontSize: '0.85rem' }}
              onClick={() => setChartPeriod('monthly')}
            >
              Previous Month
            </button>
          </div>
        </div>
        <ReadingsChart
          readings={activeChartData || []}
          title={activeChartTitle}
        />
      </div>

      {daily && daily.count > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h3>Readings on {daily.from}</h3>
          <ul className="plain">
            {daily.readings.map((r) => (
              <li key={r.id}>{r.slotLabel}: <strong>{r.value}</strong> mg/dl</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
