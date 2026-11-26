import { useEffect, useState } from 'react';
import { api, getToken, setToken, todayString } from './api.js';
import AuthForm from './AuthForm.jsx';
import ReadingForm from './ReadingForm.jsx';
import ReadingList from './ReadingList.jsx';
import Reports from './Reports.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(!!getToken());
  const [editing, setEditing] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reportDate, setReportDate] = useState(todayString());

  // Doctor state
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [doctorLoading, setDoctorLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) return;
    api('/me')
      .then((u) => {
        setUser(u);
        if (u.role === 'doctor') {
          setDoctorLoading(true);
          api('/doctor/patients')
            .then((res) => {
              setPatients(res.patients || []);
              if (res.patients?.length > 0) {
                setSelectedPatientId(res.patients[0].id);
              }
            })
            .catch(() => {})
            .finally(() => setDoctorLoading(false));
        }
      })
      .catch(() => setToken(null))
      .finally(() => setChecking(false));
  }, []);

  function handleAuth(authenticatedUser) {
    setUser(authenticatedUser);
    if (authenticatedUser.role === 'doctor') {
      setDoctorLoading(true);
      api('/doctor/patients')
        .then((res) => {
          setPatients(res.patients || []);
          if (res.patients?.length > 0) {
            setSelectedPatientId(res.patients[0].id);
          }
        })
        .catch(() => {})
        .finally(() => setDoctorLoading(false));
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
    setEditing(null);
    setPatients([]);
    setSelectedPatientId(null);
  }

  const refresh = () => setRefreshKey((k) => k + 1);

  if (checking) return <p className="center muted">Loading application...</p>;

  return (
    <div className="app">
      <header>
        <div className="brand">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <div className="brand-text">
            <h1>Sweety</h1>
            <p>Blood Glucose Tracker</p>
          </div>
          {user?.role === 'doctor' && <span className="badge doctor" style={{ marginLeft: '6px' }}>Doctor Portal</span>}
        </div>
        {user && (
          <div className="user-nav">
            <div className="user-profile">
              <div className="avatar">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="user-name">{user.name}</span>
            </div>
            <button className="secondary" onClick={logout} style={{ padding: '7px 12px', fontSize: '0.84rem' }}>
              Log out
            </button>
          </div>
        )}
      </header>

      {!user ? (
        <AuthForm onAuth={handleAuth} />
      ) : user.role === 'doctor' ? (
        <main>
          <div className="patient-select-bar">
            <div>
              <strong style={{ fontSize: '1rem', color: '#14532d' }}>Doctor Overview</strong>
              <p className="muted" style={{ fontSize: '0.82rem', margin: '2px 0 0', color: '#166534' }}>
                Select a patient below to view their glucose diary and clinical statistics.
              </p>
            </div>
            {doctorLoading ? (
              <span className="muted">Loading assigned patients...</span>
            ) : patients.length === 0 ? (
              <span className="muted">No patients assigned yet.</span>
            ) : (
              <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
                <label className="inline" style={{ margin: 0, fontWeight: 700, color: '#14532d' }}>
                  Patient:
                  <select
                    value={selectedPatientId || ''}
                    onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                    style={{ padding: '8px 12px', fontWeight: 600, borderColor: '#86efac' }}
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.email})
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>

          {selectedPatientId && (
            <>
              <Reports
                date={reportDate}
                onDateChange={setReportDate}
                refreshKey={refreshKey}
                patientId={selectedPatientId}
              />
              <ReadingList
                refreshKey={refreshKey}
                patientId={selectedPatientId}
                readOnly={true}
              />
            </>
          )}
        </main>
      ) : (
        <main>
          <ReadingForm
            editing={editing}
            onCancel={() => setEditing(null)}
            onSaved={(date) => { setEditing(null); setReportDate(date); refresh(); }}
          />
          <Reports date={reportDate} onDateChange={setReportDate} refreshKey={refreshKey} />
          <ReadingList refreshKey={refreshKey} onEdit={setEditing} onChanged={refresh} />
        </main>
      )}
    </div>
  );
}
