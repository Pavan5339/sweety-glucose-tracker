import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export default function ReadingsChart({ readings = [], title = 'Readings Trend' }) {
  const [filterSlot, setFilterSlot] = useState('all');

  if (!readings || readings.length === 0) {
    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <p className="empty">No readings available to chart for this period.</p>
      </div>
    );
  }

  // Sort readings chronologically: reading_date or date ascending
  const sorted = [...readings].sort((a, b) => {
    const da = a.date || a.reading_date;
    const db = b.date || b.reading_date;
    if (da !== db) return da.localeCompare(db);
    const slots = ['morning', 'after_breakfast', 'after_lunch', 'after_dinner'];
    return slots.indexOf(a.slot) - slots.indexOf(b.slot);
  });

  const filtered = filterSlot === 'all' ? sorted : sorted.filter((r) => r.slot === filterSlot);

  const chartData = filtered.map((r, index) => {
    const d = r.date || r.reading_date;
    const label = d.length > 5 ? d.slice(5) : d; // e.g. "11-26"
    return {
      index,
      label: `${label} (${r.slotLabel || r.slot})`,
      shortLabel: label,
      value: r.value,
      slotLabel: r.slotLabel || r.slot,
      date: d,
    };
  });

  return (
    <div className="chart-container">
      <div className="row between" style={{ marginBottom: '8px' }}>
        <h3>{title}</h3>
        <label className="inline" style={{ fontSize: '0.85rem' }}>
          Slot:
          <select value={filterSlot} onChange={(e) => setFilterSlot(e.target.value)} style={{ padding: '4px 8px' }}>
            <option value="all">All Slots</option>
            <option value="morning">Morning (fasting)</option>
            <option value="after_breakfast">After breakfast</option>
            <option value="after_lunch">After lunch</option>
            <option value="after_dinner">After dinner</option>
          </select>
        </label>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="shortLabel"
              tick={{ fontSize: 11, fill: '#64748b' }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[40, 'auto']}
              tick={{ fontSize: 11, fill: '#64748b' }}
              unit=" mg/dl"
            />
            <Tooltip
              formatter={(value, name, props) => [`${value} mg/dl`, props.payload.slotLabel]}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
              contentStyle={{ background: '#fff', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
            {/* Target glucose reference lines */}
            <ReferenceLine y={180} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'High (180)', fill: '#d97706', fontSize: 10, position: 'top' }} />
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Low (70)', fill: '#dc2626', fontSize: 10, position: 'bottom' }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0f766e"
              strokeWidth={2}
              dot={{ r: 3, fill: '#0f766e' }}
              activeDot={{ r: 6, fill: '#14b8a6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
