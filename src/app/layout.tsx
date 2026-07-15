import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'مناد — گفتگوی انسان با حقیقت',
    template: '%s — مناد',
  },
  description:
    'مناد یک شبکه‌ی اجتماعی نیست؛ موتور گفتگوی انسان با حقیقت است. تنها مرجع: قرآن.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <header className="site-header">
          <div className="inner">
            <div>
              <Link href="/" className="brand">
                مناد
              </Link>{' '}
              <span className="tagline">گفتگوی انسان با حقیقت</span>
            </div>
            <nav className="nav">
              <Link href="/new">گفتگوی تازه</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          قهرمان این‌جا حقیقت است، نه ما. — مناد
        </footer>
      </body>
    </html>
  );
}
