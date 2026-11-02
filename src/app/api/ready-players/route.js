import { route, ok } from '@/lib/http.js';
import { requireUser } from '@/lib/guard.js';
import { getScoutData } from '@/lib/service.js';
import { ROLES, scoutView } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

/** Ready players only. Available to the coach and the scout. */
export const GET = route(async () => {
  const user = await requireUser([ROLES.COACH, ROLES.SCOUT]);
  const ready = await getScoutData();
  return ok({ players: ready.map(scoutView) });
});
