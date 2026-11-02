import { route, ok, notFound } from '@/lib/http.js';
import { requireUser } from '@/lib/guard.js';
import { getPlayerSummary, getPlayerRecord } from '@/lib/service.js';
import { canViewPlayer, scoutView } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

export const GET = route(async (request, { params }) => {
  const user = await requireUser();
  const { id } = await params;

  const summary = await getPlayerSummary(id);
  if (!summary) throw notFound('Player not found.');

  if (!canViewPlayer(user, summary)) {
    // 404 rather than 403 so a scout cannot probe which ids exist.
    throw notFound('Player not found.');
  }

  if (user.role === 'scout') return ok({ player: scoutView(summary) });

  const record = await getPlayerRecord(id);
  return ok({
    player: { ...summary, guardianContact: record?.guardianContact || '' },
  });
});
