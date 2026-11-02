import { route, ok } from '@/lib/http.js';
import { requireUser } from '@/lib/guard.js';
import { listSessions, createSession } from '@/lib/service.js';
import { ROLES } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  await requireUser([ROLES.COACH]);
  return ok({ sessions: await listSessions() });
});

export const POST = route(async (request) => {
  const user = await requireUser([ROLES.COACH]);
  const body = await request.json().catch(() => ({}));
  const session = await createSession(body, user.userId);
  return ok({ session: { ...session, id: String(session._id) } }, 201);
});
