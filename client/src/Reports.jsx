import { useEffect, useState } from 'react';
import { api, todayString } from './api.js';
import ReadingsChart from './ReadingsChart.jsx';

function getGlucoseClass(val) {
  if (val < 70) return 'val-low';
  if (val <= 140) return 'val-normal';
  if (val <= 180) return 'val-elevated';
  return 'val-high';
}

function Stats({ title, report, typeClass }) {
  return (
    <div className={`report ${typeClass}`}>
      <h3>{title}</h3>
      {report && <p className="muted" style={{ fontSize: '0.82rem' }}>{report.from === report.to ? report.from : `${report.from} to ${report.to}`}</p>}
      {!report ? null : report.count === 0 ? (
        <p className="empty">No readings in this period yet.</p>
      ) : (
        <dl>
          <div>
            <dt>Highest</dt>
            <dd>{report.highest}<span className="unit">mg/dl</span></dd>
          </div>
          <div>
            <dt>Lowest</dt>
            <dd>{report.lowest}<span className="unit">mg/dl</span></dd>
          </div>
          <div>
            <dt>Average</dt>
            <dd>{report.average?.toFixed(1) ?? '-'}<span className="unit">mg/dl</span></dd>
          </div>
          <div>
            <dt>Readings</dt>
            <dd>{report.count}<span className="unit">slots</span></dd>
          </div>
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
      <div className="row between" style={{ alignItems: 'center' }}>
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Reports & Analytics
        </h2>
        <label className="inline">
          <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Selected date:</span>
          <input
            type="date"
            value={date}
            max={todayString()}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            style={{ fontWeight: 600 }}
          />
        </label>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <div className="reports">
        <Stats title="Daily Report" report={daily} typeClass="daily-report" />
        <Stats title="Month to Date" report={reports.mtd} typeClass="mtd-report" />
        <Stats title="Previous Month" report={reports.monthly} typeClass="monthly-report" />
      </div>

      {/* Visual Chart Trend */}
      <div style={{ marginTop: '20px' }}>
        <div className="row between" style={{ alignItems: 'center', marginBottom: '6px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Visual Glucose Curve
          </h3>
          <div className="row" style={{ gap: '6px' }}>
            <button
              type="button"
              className={chartPeriod === 'mtd' ? '' : 'secondary'}
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
              onClick={() => setChartPeriod('mtd')}
            >
              Month to Date
            </button>
            <button
              type="button"
              className={chartPeriod === 'monthly' ? '' : 'secondary'}
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
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
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
            Readings on {daily.from}
          </h3>
          <ul className="plain">
            {daily.readings.map((r) => (
              <li key={r.id}>
                <span className={`slot-badge slot-${r.slot}`}>{r.slotLabel}</span>
                <span className={`val-badge ${getGlucoseClass(r.value)}`}>
                  {r.value} mg/dl
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
