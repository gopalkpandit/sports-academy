import { redirect } from 'next/navigation';
import Link from 'next/link';
import LoginForm from '@/components/LoginForm.jsx';
import { getSessionUser } from '@/lib/auth.js';
import { homeForRole } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(homeForRole(user.role));

  return (
    <main className="auth-shell">
      <section className="auth-showcase">
        <Link href="/login" className="auth-brand"><span className="brand-mark">S</span> STRIDE</Link>
        <div className="showcase-copy">
          <span className="eyebrow">THE FUTURE OF YOUR GAME</span>
          <h1>Train with purpose.<br />Play with passion.</h1>
          <p>Your academy, your progress, all in one place.</p>
        </div>
        <div className="showcase-orbit" aria-hidden="true"><span> S </span></div>
        <div className="showcase-bottom">BUILT FOR THE LOVE OF SPORT <span>PLAYERS / COACHES / SCOUTS</span></div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <span className="eyebrow auth-eyebrow">WELCOME BACK</span>
          <h2>Sign in to STRIDE</h2>
          <p className="auth-description">Continue where your game left off.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
