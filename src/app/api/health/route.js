import { ok } from '@/lib/http.js';
import { configProblems } from '@/lib/env.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const problems = configProblems();
  return ok({
    service: 'sports-academy-management-system',
    status: problems.length === 0 ? 'up' : 'needs-configuration',
    configured: problems.length === 0,
    problems,
    time: new Date().toISOString(),
  });
}
