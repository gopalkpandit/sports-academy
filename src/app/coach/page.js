import Link from 'next/link';
import { loadAcademy, getCoachStats, getRecentAttendance, getPlayerSummaries } from '@/lib/service.js';

export const dynamic = 'force-dynamic';

function Stat({ label, value, hint, ready }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className={ready ? 'value ready' : 'value'}>{value}</div>
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

export default async function CoachDashboard() {
  const academy = await loadAcademy();
  const stats = await getCoachStats(academy);
  const recent = await getRecentAttendance(academy, 5);
  const summaries = await getPlayerSummaries(academy);
  const ready = summaries.filter((player) => player.status === 'Ready');

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Coach dashboard</h1>
          <p className="sub">Everything happening at the academy today.</p>
        </div>
        <div className="btn-row">
          <Link className="badge closed" href="/coach/sessions">New session</Link>
          <Link className="badge closed" href="/coach/matches">New match</Link>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginBottom: '1.25rem' }}>
        <Stat label="Total players" value={stats.totalPlayers} />
        <Stat label="Total sessions" value={stats.totalSessions} hint={`${stats.openSessions} still open`} />
        <Stat label="Total matches" value={stats.totalMatches} />
        <Stat label="Ready players" value={stats.readyPlayers} hint="75%+ attendance and 2+ matches" ready />
      </div>

      <div className="grid cols-2">
        <section className="card">
          <h2>Recent attendance</h2>
          {recent.length === 0 ? (
            <p className="empty">No practice sessions yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Sport</th>
                    <th className="num">Present</th>
                    <th className="num">Absent</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link href={`/coach/sessions/${row.id}`}>{row.date}</Link>
                      </td>
                      <td>{row.sport}</td>
                      <td className="num">{row.present}</td>
                      <td className="num">{row.absent}</td>
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
          <h2>Ready players</h2>
          {ready.length === 0 ? (
            <p className="empty">
              No player is Ready yet. A player needs at least 75% attendance and 2 matches.
            </p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th className="num">Attendance</th>
                    <th className="num">Matches</th>
                  </tr>
                </thead>
                <tbody>
                  {ready.map((player) => (
                    <tr key={player.id}>
                      <td>{player.name}</td>
                      <td className="num">{player.attendancePercent}%</td>
                      <td className="num">{player.matchesPlayed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
