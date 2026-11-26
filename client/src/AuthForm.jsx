import { useState } from 'react';
import { api, setToken } from './api.js';

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function fillDemo(email, password) {
    setMode('login');
    setForm((f) => ({ ...f, email, password }));
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login' ? { email: form.email, password: form.password } : form;
      const data = await api(path, { method: 'POST', body });
      setToken(data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card auth" onSubmit={submit} noValidate>
      <div className="auth-header">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <div className="brand-icon" style={{ width: '48px', height: '48px', borderRadius: '14px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
        </div>
        <h2>{mode === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
        <p className="muted">
          {mode === 'login' ? 'Log in to record and view your glucose reports' : 'Register to start tracking your daily glucose readings'}
        </p>
      </div>

      {mode === 'register' && (
        <>
          <label>
            Full Name
            <input value={form.name} onChange={set('name')} autoComplete="name" placeholder="e.g. Jane Doe" />
          </label>
          <label>
            Account Role
            <select value={form.role} onChange={set('role')}>
              <option value="patient">Patient (track glucose & view reports)</option>
              <option value="doctor">Doctor (view assigned patients)</option>
            </select>
          </label>
        </>
      )}

      <label>
        Email Address
        <input type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="name@example.com" />
      </label>

      <label>
        Password
        <input
          type="password"
          value={form.password}
          onChange={set('password')}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          placeholder="At least 8 characters"
        />
      </label>

      {error && <p className="error" role="alert">{error}</p>}

      <button disabled={busy} style={{ width: '100%', marginTop: '4px' }}>
        {busy ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create Account'}
      </button>

      <div className="demo-box">
        <strong style={{ color: '#334155', display: 'block', marginBottom: '6px' }}>⚡ Demo Accounts (1-Click Fill):</strong>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }}
            onClick={() => fillDemo('demo@sweety.test', 'demo1234')}
          >
            Demo Patient
          </button>
          <button
            type="button"
            className="secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }}
            onClick={() => fillDemo('doctor@sweety.test', 'doctor1234')}
          >
            Demo Doctor
          </button>
        </div>
      </div>

      <p className="muted center" style={{ marginTop: '4px' }}>
        {mode === 'login' ? "Don't have an account?" : 'Already registered?'}{' '}
        <a
          href="#"
          style={{ color: '#0d9488', fontWeight: 700, textDecoration: 'none' }}
          onClick={(e) => { e.preventDefault(); setError(''); setMode(mode === 'login' ? 'register' : 'login'); }}
        >
          {mode === 'login' ? 'Sign up' : 'Log in'}
        </a>
      </p>
    </form>
  );
}
