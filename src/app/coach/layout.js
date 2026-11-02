import { redirect } from 'next/navigation';
import TopBar from '@/components/TopBar.jsx';
import { getSessionUser } from '@/lib/auth.js';
import { canOpenArea } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

export default async function CoachLayout({ children }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!canOpenArea(user, 'coach')) redirect('/');
  return (
    <>
      <TopBar user={user} />
      <main className="page">{children}</main>
    </>
  );
}
