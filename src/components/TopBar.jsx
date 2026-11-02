import Link from 'next/link';
import LogoutButton from './LogoutButton.jsx';

const links = {
  coach: [
    { href: '/coach', label: 'Dashboard' },
    { href: '/coach/players', label: 'Players' },
    { href: '/coach/sessions', label: 'Sessions' },
    { href: '/coach/matches', label: 'Matches' },
  ],
  player: [{ href: '/player', label: 'My dashboard' }],
  scout: [{ href: '/scout', label: 'Ready players' }],
};

export default function TopBar({ user }) {
  const nav = links[user?.role] || [];
  return (
    <header className="topbar">
      <div className="brand">
        <span className="dot" />
        Sports Academy
      </div>
      <nav>
        {nav.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        {user ? (
          <>
            <span className="who">
              <b>{user.name}</b> · {user.role}
            </span>
            <LogoutButton />
          </>
        ) : (
          <Link href="/login">Log in</Link>
        )}
      </nav>
    </header>
  );
}
