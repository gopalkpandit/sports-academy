import Link from 'next/link';
import { CreateSessionForm } from '@/components/CoachForms.jsx';
import { listSessions } from '@/lib/service.js';

export const dynamic = 'force-dynamic';

export default async function SessionsPage() {
  const sessions = await listSessions();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Practice sessions</h1>
          <p className="sub">Open a session, mark Present / Absent, then close it to lock attendance.</p>
        </div>
      </div>

      <section className="card">
        <h2>Create a session</h2>
        <CreateSessionForm />
      </section>

      <section className="card">
        <h2>All sessions</h2>
        {sessions.length === 0 ? (
          <p className="empty">No sessions yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sport</th>
                  <th className="num">Marked</th>
                  <th className="num">Present</th>
                  <th className="num">Absent</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.date}</td>
                    <td>{session.sport}</td>
                    <td className="num">{session.marked}</td>
                    <td className="num">{session.present}</td>
                    <td className="num">{session.absent}</td>
                    <td>
                      <span className={`badge ${session.status}`}>{session.status}</span>
                    </td>
                    <td>
                      <Link className="badge closed" href={`/coach/sessions/${session.id}`}>
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
