import { route, ok } from '@/lib/http.js';
import { requireUser } from '@/lib/guard.js';
import { markAttendance } from '@/lib/service.js';
import { ROLES } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

/**
 * Mark Present / Absent. Rejected with 400 SESSION_LOCKED when the session has
 * been closed, so locked attendance can never be edited.
 */
export const POST = route(async (request, { params }) => {
  const user = await requireUser([ROLES.COACH]);
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const records = Array.isArray(body.records) ? body.records : [];
  const result = await markAttendance(id, records, user.userId);
  return ok(result);
});
