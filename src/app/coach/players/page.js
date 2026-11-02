import Link from 'next/link';
import { AddPlayerForm } from '@/components/CoachForms.jsx';
import { getPlayerSummaries } from '@/lib/service.js';

export const dynamic = 'force-dynamic';

export default async function PlayersPage() {
  const players = await getPlayerSummaries();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Players</h1>
          <p className="sub">{players.length} player(s) in the academy.</p>
        </div>
      </div>

      <section className="card">
        <h2>Add a player</h2>
        <AddPlayerForm />
      </section>

      <section className="card">
        <h2>All players</h2>
        {players.length === 0 ? (
          <p className="empty">No players yet. Add your first player above.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="num">Age</th>
                  <th>Sport</th>
                  <th className="num">Present</th>
                  <th className="num">Attendance</th>
                  <th className="num">Matches</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id}>
                    <td>{player.name}</td>
                    <td className="num">{player.age}</td>
                    <td>{player.sport}</td>
                    <td className="num">
                      {player.presentCount}/{player.totalSessions}
                    </td>
                    <td className="num">{player.attendancePercent}%</td>
                    <td className="num">{player.matchesPlayed}</td>
                    <td>
                      <span className={player.status === 'Ready' ? 'badge ready' : 'badge not-ready'}>
                        {player.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
