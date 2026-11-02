'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client.js';

export default function MatchScoreForm({ matchId, options }) {
  const router = useRouter();
  const available = options.filter((option) => !option.alreadyScored);
  const [playerId, setPlayerId] = useState(available.find((o) => o.eligible)?.id || '');
  const [score, setScore] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  const selected = options.find((option) => option.id === playerId);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setDone('');
    setBusy(true);
    try {
      await api(`/api/matches/${matchId}/scores`, {
        method: 'POST',
        body: { playerId, score },
      });
      setDone('Score saved.');
      setScore('');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeScore(targetId) {
    setError('');
    setDone('');
    setBusy(true);
    try {
      await api(`/api/matches/${matchId}/scores?playerId=${targetId}`, { method: 'DELETE' });
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        {error ? <div className="alert error">{error}</div> : null}
        {done ? <div className="alert success">{done}</div> : null}
        <div className="form-row">
          <div className="field">
            <label htmlFor="score-player">Player</label>
            <select
              id="score-player"
              value={playerId}
              onChange={(event) => setPlayerId(event.target.value)}
              required
            >
              <option value="">Select a player…</option>
              {available.map((option) => (
                <option key={option.id} value={option.id} disabled={!option.eligible}>
                  {option.name}
                  {option.eligible ? '' : ' — absent for the session on this date'}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="score-value">Score</label>
            <input
              id="score-value"
              type="number"
              min="0"
              max="1000"
              step="1"
              value={score}
              onChange={(event) => setScore(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <button type="submit" disabled={busy || !playerId}>
              {busy ? 'Saving…' : 'Add to score sheet'}
            </button>
          </div>
        </div>
      </form>

      {selected && !selected.eligible ? (
        <div className="alert warn" style={{ marginTop: '0.5rem' }}>
          {selected.reason}
        </div>
      ) : null}

      {options.some((option) => option.alreadyScored) ? (
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ marginBottom: '0.4rem' }}>Remove a player</h3>
          <div className="btn-row">
            {options
              .filter((option) => option.alreadyScored)
              .map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="danger small"
                  disabled={busy}
                  onClick={() => removeScore(option.id)}
                >
                  Remove {option.name}
                </button>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
