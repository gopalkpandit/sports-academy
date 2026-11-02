import Link from 'next/link';
import { CreateMatchForm } from '@/components/CoachForms.jsx';
import { listMatches } from '@/lib/service.js';

export const dynamic = 'force-dynamic';

export default async function MatchesPage() {
  const matches = await listMatches();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Matches</h1>
          <p className="sub">
            Players marked absent for the practice session on a match date cannot be added to that
            match.
          </p>
        </div>
      </div>

      <section className="card">
        <h2>Create a match</h2>
        <CreateMatchForm />
      </section>

      <section className="card">
        <h2>All matches</h2>
        {matches.length === 0 ? (
          <p className="empty">No matches yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sport</th>
                  <th>Opponent</th>
                  <th className="num">Players</th>
                  <th className="num">Total score</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.id}>
                    <td>{match.date}</td>
                    <td>{match.sport}</td>
                    <td>{match.opponent}</td>
                    <td className="num">{match.players}</td>
                    <td className="num">{match.totalScore}</td>
                    <td>
                      <Link className="badge closed" href={`/coach/matches/${match.id}`}>
                        Open
                      </Link>
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
