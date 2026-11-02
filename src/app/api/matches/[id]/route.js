import { route, ok, notFound } from '@/lib/http.js';
import { requireUser } from '@/lib/guard.js';
import { getMatchDetail } from '@/lib/service.js';
import { ROLES } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

export const GET = route(async (request, { params }) => {
  await requireUser([ROLES.COACH]);
  const { id } = await params;
  const match = await getMatchDetail(id);
  if (!match) throw notFound('Match not found.');
  return ok({ match });
});
