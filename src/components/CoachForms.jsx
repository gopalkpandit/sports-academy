'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client.js';

function useSubmit() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  async function run(action, successMessage) {
    setError('');
    setDone('');
    setBusy(true);
    try {
      await action();
      setDone(successMessage);
      router.refresh();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, done, run };
}

export function AddPlayerForm() {
  const { busy, error, done, run } = useSubmit();
  const [form, setForm] = useState({ name: '', age: '', sport: '', guardianContact: '' });

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function onSubmit(event) {
    event.preventDefault();
    const saved = await run(
      () => api('/api/players', { method: 'POST', body: form }),
      `${form.name} added to the academy.`
    );
    if (saved) setForm({ name: '', age: '', sport: form.sport, guardianContact: '' });
  }

  return (
    <form onSubmit={onSubmit}>
      {error ? <div className="alert error">{error}</div> : null}
      {done ? <div className="alert success">{done}</div> : null}
      <div className="form-row">
        <div className="field">
          <label htmlFor="player-name">Name</label>
          <input id="player-name" value={form.name} onChange={update('name')} required />
        </div>
        <div className="field">
          <label htmlFor="player-age">Age</label>
          <input id="player-age" type="number" min="5" max="90" value={form.age} onChange={update('age')} required />
        </div>
        <div className="field">
          <label htmlFor="player-sport">Sport</label>
          <input id="player-sport" value={form.sport} onChange={update('sport')} placeholder="Cricket" required />
        </div>
        <div className="field">
          <label htmlFor="player-contact">Guardian contact (optional)</label>
          <input id="player-contact" value={form.guardianContact} onChange={update('guardianContact')} />
        </div>
        <div className="field">
          <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Add player'}</button>
        </div>
      </div>
    </form>
  );
}

export function CreateSessionForm({ defaultSport = '' }) {
  const { busy, error, done, run } = useSubmit();
  const [date, setDate] = useState('');
  const [sport, setSport] = useState(defaultSport);

  async function onSubmit(event) {
    event.preventDefault();
    const saved = await run(
      () => api('/api/sessions', { method: 'POST', body: { date, sport } }),
      'Practice session created. Mark attendance next.'
    );
    if (saved) setDate('');
  }

  return (
    <form onSubmit={onSubmit}>
      {error ? <div className="alert error">{error}</div> : null}
      {done ? <div className="alert success">{done}</div> : null}
      <div className="form-row">
        <div className="field">
          <label htmlFor="session-date">Session date</label>
          <input id="session-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="session-sport">Sport</label>
          <input id="session-sport" value={sport} onChange={(event) => setSport(event.target.value)} required />
        </div>
        <div className="field">
          <button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create session'}</button>
        </div>
      </div>
    </form>
  );
}

export function CreateMatchForm({ defaultSport = '' }) {
  const { busy, error, done, run } = useSubmit();
  const [form, setForm] = useState({ date: '', sport: defaultSport, opponent: '', venue: '' });
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  async function onSubmit(event) {
    event.preventDefault();
    const saved = await run(
      () => api('/api/matches', { method: 'POST', body: form }),
      'Match created. Add player scores next.'
    );
    if (saved) setForm({ date: '', sport: form.sport, opponent: '', venue: '' });
  }

  return (
    <form onSubmit={onSubmit}>
      {error ? <div className="alert error">{error}</div> : null}
      {done ? <div className="alert success">{done}</div> : null}
      <div className="form-row">
        <div className="field">
          <label htmlFor="match-date">Match date</label>
          <input id="match-date" type="date" value={form.date} onChange={update('date')} required />
        </div>
        <div className="field">
          <label htmlFor="match-sport">Sport</label>
          <input id="match-sport" value={form.sport} onChange={update('sport')} required />
        </div>
        <div className="field">
          <label htmlFor="match-opponent">Opponent</label>
          <input id="match-opponent" value={form.opponent} onChange={update('opponent')} required />
        </div>
        <div className="field">
          <label htmlFor="match-venue">Venue (optional)</label>
          <input id="match-venue" value={form.venue} onChange={update('venue')} />
        </div>
        <div className="field">
          <button type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create match'}</button>
        </div>
      </div>
    </form>
  );
}

export function CloseSessionButton({ sessionId }) {
  const { busy, error, run } = useSubmit();

  return (
    <div>
      {error ? <div className="alert error">{error}</div> : null}
      <button
        type="button"
        className="danger"
        disabled={busy}
        onClick={() =>
          run(() => api(`/api/sessions/${sessionId}/close`, { method: 'POST' }), 'Session closed.')
        }
      >
        {busy ? 'Closing…' : 'Close session & lock attendance'}
      </button>
    </div>
  );
}
