'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client.js';

export default function AttendanceForm({ sessionId, players, locked }) {
  const router = useRouter();
  const [marks, setMarks] = useState(() => {
    const initial = {};
    for (const player of players) initial[player.id] = player.status || 'present';
    return initial;
  });
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);

  function setMark(playerId, status) {
    setMarks((current) => ({ ...current, [playerId]: status }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setDone('');
    setBusy(true);
    try {
      const records = players.map((player) => ({
        playerId: player.id,
        status: marks[player.id] || 'absent',
      }));
      await api(`/api/sessions/${sessionId}/attendance`, { method: 'POST', body: { records } });
      setDone('Attendance saved.');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (players.length === 0) {
    return <p className="empty">Add players to the academy before marking attendance.</p>;
  }

  return (
    <form onSubmit={onSubmit}>
      {error ? <div className="alert error">{error}</div> : null}
      {done ? <div className="alert success">{done}</div> : null}
      {locked ? (
        <div className="alert info">
          This session is closed. Attendance is locked and can no longer be edited.
        </div>
      ) : null}

      {players.map((player) => (
        <div className="att-row" key={player.id}>
          <div>
            <div className="att-name">{player.name}</div>
            <div className="att-meta">
              {player.sport}
              {player.status ? ` · currently marked ${player.status}` : ' · not marked yet'}
            </div>
          </div>
          <div className="att-choice">
            <label>
              <input
                type="radio"
                name={`status-${player.id}`}
                value="present"
                checked={marks[player.id] === 'present'}
                disabled={locked}
                onChange={() => setMark(player.id, 'present')}
              />
              Present
            </label>
            <label>
              <input
                type="radio"
                name={`status-${player.id}`}
                value="absent"
                checked={marks[player.id] === 'absent'}
                disabled={locked}
                onChange={() => setMark(player.id, 'absent')}
              />
              Absent
            </label>
          </div>
        </div>
      ))}

      {!locked ? (
        <div className="btn-row" style={{ marginTop: '1rem' }}>
          <button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save attendance'}</button>
        </div>
      ) : null}
    </form>
  );
}
