import { route, ok } from '@/lib/http.js';
import { requireUser } from '@/lib/guard.js';
import { addMatchScore, removeMatchScore } from '@/lib/service.js';
import { ROLES } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

/**
 * Add a player's score. A player marked Absent for the practice session on the
 * match date is rejected with 400 PLAYER_ABSENT (Test 2).
 */
export const POST = route(async (request, { params }) => {
  const user = await requireUser([ROLES.COACH]);
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const result = await addMatchScore(id, body, user.userId);
  return ok(result, 201);
});

export const DELETE = route(async (request, { params }) => {
  await requireUser([ROLES.COACH]);
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get('playerId');
  const result = await removeMatchScore(id, playerId);
  return ok(result);
});
