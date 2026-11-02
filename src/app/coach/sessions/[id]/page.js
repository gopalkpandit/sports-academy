import Link from 'next/link';
import { notFound } from 'next/navigation';
import AttendanceForm from '@/components/AttendanceForm.jsx';
import { CloseSessionButton } from '@/components/CoachForms.jsx';
import { getSessionDetail } from '@/lib/service.js';

export const dynamic = 'force-dynamic';

export default async function SessionDetailPage({ params }) {
  const { id } = await params;
  const session = await getSessionDetail(id);
  if (!session) notFound();

  return (
    <>
      <div className="page-head">
        <div>
          <h1>
            {session.sport} · {session.date}
          </h1>
          <p className="sub">
            Session status: <span className={`badge ${session.status}`}>{session.status}</span>
          </p>
        </div>
        <Link className="badge closed" href="/coach/sessions">
          Back to sessions
        </Link>
      </div>

      <section className="card">
        <h2>Mark attendance</h2>
        <AttendanceForm sessionId={session.id} players={session.players} locked={session.locked} />
      </section>

      {!session.locked ? (
        <section className="card">
          <h2>Close the session</h2>
          <p className="sub" style={{ marginBottom: '0.9rem' }}>
            Every player must be marked before closing. Once closed, attendance is locked.
          </p>
          <CloseSessionButton sessionId={session.id} />
        </section>
      ) : null}
    </>
  );
}
