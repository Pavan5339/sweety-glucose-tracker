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

  if (checking) return <p className="center muted">Loading...</p>;

  return (
    <div className="app">
      <header>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h1>Sweety</h1>
          {user?.role === 'doctor' && <span className="badge doctor">Doctor Portal</span>}
        </div>
        {user && (
          <div className="row">
            <span className="muted">
              Hi, {user.name} {user.role === 'doctor' ? '(Doctor)' : ''}
            </span>
            <button className="secondary" onClick={logout}>Log out</button>
          </div>
        )}
      </header>

      {!user ? (
        <AuthForm onAuth={handleAuth} />
      ) : user.role === 'doctor' ? (
        <main>
          <div className="card patient-select-bar">
            <strong>Assigned Patients:</strong>
            {doctorLoading ? (
              <span className="muted">Loading patients...</span>
            ) : patients.length === 0 ? (
              <span className="muted">No patients currently assigned to you.</span>
            ) : (
              <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
                <select
                  value={selectedPatientId || ''}
                  onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                  style={{ padding: '6px 12px', fontWeight: 500 }}
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.email})
                    </option>
                  ))}
                </select>
                <span className="muted" style={{ fontSize: '0.85rem' }}>
                  Viewing reports for patient #{selectedPatientId}
                </span>
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
