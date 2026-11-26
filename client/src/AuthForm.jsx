import { useState } from 'react';
import { api, setToken } from './api.js';

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

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
    <form className="card auth" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Log in' : 'Create your account'}</h2>
      {mode === 'register' && (
        <label>
          Name
          <input value={form.name} onChange={set('name')} autoComplete="name" />
        </label>
      )}
      <label>
        Email
        <input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
      </label>
      <label>
        Password
        <input type="password" value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button disabled={busy}>{mode === 'login' ? 'Log in' : 'Sign up'}</button>
      <p className="muted">
        {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); setError(''); setMode(mode === 'login' ? 'register' : 'login'); }}>
          {mode === 'login' ? 'Create an account' : 'Log in'}
        </a>
      </p>
    </form>
  );
}
