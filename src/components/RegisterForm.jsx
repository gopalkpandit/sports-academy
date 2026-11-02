'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/client.js';

const ROLES = [
  { id: 'coach', name: 'Coach', detail: 'Manage your academy' },
  { id: 'player', name: 'Player', detail: 'Track your progress' },
  { id: 'scout', name: 'Scout', detail: 'Discover talent' },
];

export default function RegisterForm() {
  const router = useRouter();
  const [role, setRole] = useState('player');
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '', sport: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api('/api/auth/register', {
        method: 'POST',
        body: { ...form, role },
      });
      router.replace(data.redirectTo || '/');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="auth-form">
      <div className="role-label">I am joining as</div>
      <div className="role-grid">
        {ROLES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={role === item.id ? 'role-card active' : 'role-card'}
            onClick={() => setRole(item.id)}
            aria-pressed={role === item.id}
          >
            <span className="role-title">{item.name}</span>
            <span className="role-blurb">{item.detail}</span>
          </button>
        ))}
      </div>
      {error ? <div className="alert error" role="alert">{error}</div> : null}
      <div className="field">
        <label htmlFor="name">Full name</label>
        <input id="name" name="name" value={form.name} onChange={update} autoComplete="name" maxLength={80} required />
      </div>
      <div className="field">
        <label htmlFor="register-email">Email address</label>
        <input
          id="register-email"
          name="email"
          type="email"
          value={form.email}
          onChange={update}
          autoComplete="email"
          required
        />
      </div>
      {role === 'player' ? (
        <div className="auth-row">
          <div className="field">
            <label htmlFor="age">Age</label>
            <input id="age" name="age" type="number" min="5" max="90" value={form.age} onChange={update} required />
          </div>
          <div className="field">
            <label htmlFor="sport">Sport</label>
            <input id="sport" name="sport" value={form.sport} onChange={update} maxLength={40} required />
          </div>
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          name="password"
          type="password"
          value={form.password}
          onChange={update}
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          required
        />
      </div>
      <button type="submit" className="auth-submit" disabled={busy}>
        {busy ? 'Creating account…' : 'Create account'}
      </button>
      <p className="auth-switch">
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
