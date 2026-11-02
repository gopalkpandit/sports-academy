import { route, ok, notFound } from '@/lib/http.js';
import { requireUser } from '@/lib/guard.js';
import { getSessionDetail } from '@/lib/service.js';
import { ROLES } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

export const GET = route(async (request, { params }) => {
  await requireUser([ROLES.COACH]);
  const { id } = await params;
  const session = await getSessionDetail(id);
  if (!session) throw notFound('Session not found.');
  return ok({ session });
});
