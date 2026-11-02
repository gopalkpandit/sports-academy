import Link from 'next/link';
import { notFound } from 'next/navigation';
import MatchScoreForm from '@/components/MatchScoreForm.jsx';
import { getMatchDetail } from '@/lib/service.js';

export const dynamic = 'force-dynamic';

export default async function MatchDetailPage({ params }) {
  const { id } = await params;
  const match = await getMatchDetail(id);
  if (!match) notFound();

  const blocked = match.options.filter((option) => !option.eligible);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>
            vs {match.opponent} · {match.date}
          </h1>
          <p className="sub">
            {match.sport}
            {match.venue ? ` · ${match.venue}` : ''}
          </p>
        </div>
        <Link className="badge closed" href="/coach/matches">
          Back to matches
        </Link>
      </div>

      <section className="card">
        <h2>Score sheet</h2>
        {match.scores.length === 0 ? (
          <p className="empty">No scores entered yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th className="num">Score</th>
                </tr>
              </thead>
              <tbody>
                {match.scores.map((row) => (
                  <tr key={row.playerId}>
                    <td>{row.playerName}</td>
                    <td className="num">{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Add a player to this match</h2>
        <MatchScoreForm matchId={match.id} options={match.options} />
      </section>

      {blocked.length > 0 ? (
        <section className="card">
          <h2>Blocked by attendance</h2>
          <p className="sub" style={{ marginBottom: '0.75rem' }}>
            These players were marked Absent for the session on {match.date}, so the system will
            reject them for this match.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {blocked.map((option) => (
                  <tr key={option.id}>
                    <td>{option.name}</td>
                    <td className="muted">{option.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
}
