import { redirect } from 'next/navigation';
import TopBar from '@/components/TopBar.jsx';
import { getSessionUser } from '@/lib/auth.js';
import { getPlayerDashboard } from '@/lib/service.js';
import { canOpenArea } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

export default async function PlayerDashboard() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!canOpenArea(user, 'player')) redirect('/');

  const dashboard = user.playerId ? await getPlayerDashboard(user.playerId) : null;

  if (!dashboard) {
    return (
      <>
        <TopBar user={user} />
        <main className="page">
          <div className="alert warn">
            This login is not linked to a player record yet. Ask the coach to link your account.
          </div>
        </main>
      </>
    );
  }

  const { profile, summary, attendance, scores } = dashboard;

  return (
    <>
      <TopBar user={user} />
      <main className="page">
        <div className="page-head">
          <div>
            <h1>Hi {profile.name}</h1>
            <p className="sub">
              {profile.sport} · age {profile.age}
            </p>
          </div>
          <span className={summary.status === 'Ready' ? 'badge ready' : 'badge not-ready'}>
            {summary.status}
          </span>
        </div>

        <div className="grid cols-4" style={{ marginBottom: '1.25rem' }}>
          <div className="stat">
            <div className="label">My attendance</div>
            <div className="value">{summary.attendancePercent}%</div>
            <div className="hint">
              {summary.presentCount} of {summary.totalSessions} sessions
            </div>
          </div>
          <div className="stat">
            <div className="label">Matches played</div>
            <div className="value">{summary.matchesPlayed}</div>
            <div className="hint">at least 2 needed</div>
          </div>
          <div className="stat">
            <div className="label">Ready status</div>
            <div className={summary.status === 'Ready' ? 'value ready' : 'value'}>
              {summary.status}
            </div>
            <div className="hint">75% attendance + 2 matches</div>
          </div>
          <div className="stat">
            <div className="label">Sessions missed</div>
            <div className="value">{summary.absentCount}</div>
            <div className="hint">marked absent</div>
          </div>
        </div>

        {summary.reasons.length > 0 ? (
          <div className="alert info">
            Not Ready yet: {summary.reasons.join(' · ')}
          </div>
        ) : (
          <div className="alert success">You are Ready to be reviewed by scouts.</div>
        )}

        <div className="grid cols-2">
          <section className="card">
            <h2>My attendance</h2>
            {attendance.length === 0 ? (
              <p className="empty">No attendance recorded yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Sport</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((row) => (
                      <tr key={`${row.date}-${row.sport}`}>
                        <td>{row.date}</td>
                        <td>{row.sport}</td>
                        <td>
                          <span className={`badge ${row.status}`}>{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="card">
            <h2>My match scores</h2>
            {scores.length === 0 ? (
              <p className="empty">No match scores yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Opponent</th>
                      <th className="num">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((row) => (
                      <tr key={`${row.date}-${row.opponent}`}>
                        <td>{row.date}</td>
                        <td>{row.opponent}</td>
                        <td className="num">{row.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
