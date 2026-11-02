import { route, ok } from '@/lib/http.js';
import { requireUser } from '@/lib/guard.js';
import { listMatches, createMatch } from '@/lib/service.js';
import { ROLES } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  await requireUser([ROLES.COACH]);
  return ok({ matches: await listMatches() });
});

export const POST = route(async (request) => {
  const user = await requireUser([ROLES.COACH]);
  const body = await request.json().catch(() => ({}));
  const match = await createMatch(body, user.userId);
  return ok({ match: { ...match, id: String(match._id) } }, 201);
});
