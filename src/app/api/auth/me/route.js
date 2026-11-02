import { route, ok } from '@/lib/http.js';
import { requireUser } from '@/lib/guard.js';

export const dynamic = 'force-dynamic';

export const GET = route(async () => {
  const user = await requireUser();
  return ok({ user });
});
