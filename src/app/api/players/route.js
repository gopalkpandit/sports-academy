import { route, ok } from '@/lib/http.js';
import { requireUser } from '@/lib/guard.js';
import { createPlayer, getPlayerSummaries } from '@/lib/service.js';
import { ROLES, filterVisiblePlayers } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

/** Coach: everyone. Scout: Ready players only. Player: their own record only. */
export const GET = route(async () => {
  const user = await requireUser();
  const summaries = await getPlayerSummaries();
  const visible = filterVisiblePlayers(user, summaries);

  if (user.role === ROLES.SCOUT) {
    return ok({
      players: visible.map((player) => ({
        id: player.id,
        name: player.name,
        age: player.age,
        sport: player.sport,
        attendancePercent: player.attendancePercent,
        matchesPlayed: player.matchesPlayed,
        status: player.status,
      })),
    });
  }

  return ok({ players: visible });
});

export const POST = route(async (request) => {
  const user = await requireUser([ROLES.COACH]);
  const body = await request.json().catch(() => ({}));
  const player = await createPlayer(body);
  return ok({ player }, 201);
});
