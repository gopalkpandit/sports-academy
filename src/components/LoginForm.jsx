'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/client.js';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
      router.replace(data.redirectTo || '/');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="auth-form">
      {error ? <div className="alert error" role="alert">{error}</div> : null}
      <div className="field">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          value={email}
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <button type="submit" className="auth-submit" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="auth-switch">
        New to the academy? <Link href="/register">Create an account</Link>
      </p>
    </form>
  );
}
