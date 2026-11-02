import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth.js';
import { homeForRole } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getSessionUser();
  redirect(user ? homeForRole(user.role) : '/login');
}
