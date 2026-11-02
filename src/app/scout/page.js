import { redirect } from 'next/navigation';
import TopBar from '@/components/TopBar.jsx';
import { getSessionUser } from '@/lib/auth.js';
import { getScoutData } from '@/lib/service.js';
import { canOpenArea } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

export default async function ScoutDashboard() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!canOpenArea(user, 'scout')) redirect('/');

  const players = await getScoutData();

  return (
    <>
      <TopBar user={user} />
      <main className="page">
        <div className="page-head">
          <div>
            <h1>Ready players</h1>
            <p className="sub">
              Only players who have reached 75% attendance and played at least 2 matches are shown.
            </p>
          </div>
          <span className="badge ready">{players.length} eligible</span>
        </div>

        <section className="card">
          {players.length === 0 ? (
            <p className="empty">No player is Ready right now. Check back after the next match.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th className="num">Age</th>
                    <th>Sport</th>
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
                      <td className="num">{player.attendancePercent}%</td>
                      <td className="num">{player.matchesPlayed}</td>
                      <td>
                        <span className="badge ready">{player.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="muted">
          Scouts cannot open a player who is Not Ready, and cannot see contact details or account
          information. The restriction is enforced by the server, not just by this page.
        </p>
      </main>
    </>
  );
}
