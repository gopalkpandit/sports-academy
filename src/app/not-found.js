import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page">
      <div className="card">
        <h1>Page not found</h1>
        <p className="sub" style={{ marginBottom: '1rem' }}>
          The page you asked for does not exist.
        </p>
        <Link href="/">Go back to your dashboard</Link>
      </div>
    </main>
  );
}
