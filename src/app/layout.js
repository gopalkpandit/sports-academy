import './globals.css';

export const metadata = {
  title: 'STRIDE | Sports Academy',
  description:
    'Train with purpose. Manage your sports academy, track progress, and discover talent with STRIDE.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
