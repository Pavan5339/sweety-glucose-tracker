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

  useEffect(() => {
    if (!getToken()) return;
    api('/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setChecking(false));
  }, []);

  function logout() {
    setToken(null);
    setUser(null);
    setEditing(null);
  }

  const refresh = () => setRefreshKey((k) => k + 1);

  if (checking) return <p className="center muted">Loading...</p>;

  return (
    <div className="app">
      <header>
        <h1>Sweety</h1>
        {user && (
          <div className="row">
            <span className="muted">Hi, {user.name}</span>
            <button className="secondary" onClick={logout}>Log out</button>
          </div>
        )}
      </header>
      {!user ? (
        <AuthForm onAuth={setUser} />
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
