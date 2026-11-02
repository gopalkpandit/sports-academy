import { route, ok } from '@/lib/http.js';
import { requireUser } from '@/lib/guard.js';
import { closeSession } from '@/lib/service.js';
import { ROLES } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

export const POST = route(async (request, { params }) => {
  const user = await requireUser([ROLES.COACH]);
  const { id } = await params;
  const result = await closeSession(id, user.userId);
  return ok(result);
});
