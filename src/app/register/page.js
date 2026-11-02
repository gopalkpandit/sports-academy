import { redirect } from 'next/navigation';
import Link from 'next/link';
import RegisterForm from '@/components/RegisterForm.jsx';
import { getSessionUser } from '@/lib/auth.js';
import { homeForRole } from '@/lib/rbac.js';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect(homeForRole(user.role));

  return (
    <main className="auth-shell">
      <section className="auth-showcase">
        <Link href="/login" className="auth-brand"><span className="brand-mark">S</span> STRIDE</Link>
        <div className="showcase-copy">
          <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>Find your place<br />in the game.</h1>
          <p>One community. Every role. A better way to move forward.</p>
        </div>
        <div className="showcase-orbit" aria-hidden="true"><span> S </span></div>
        <div className="showcase-bottom">BUILT FOR THE LOVE OF SPORT <span>PLAYERS / COACHES / SCOUTS</span></div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <span className="eyebrow auth-eyebrow">JOIN STRIDE</span>
          <h2>Create your account</h2>
          <p className="auth-description">Choose your role and get started.</p>
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
