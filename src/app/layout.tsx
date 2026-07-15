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
  icons: { icon: '/icon.svg' },
};

/** نشان مناد: دایره و نقطه‌ی مرکزی — «مناد» یعنی واحد بسیط. */
function BrandMark() {
  return (
    <svg
      className="mark"
      viewBox="0 0 256 256"
      width={26}
      height={26}
      aria-hidden="true"
    >
      <circle
        fill="none"
        stroke="currentColor"
        strokeWidth={14}
        cx={128}
        cy={128}
        r={114}
      />
      <circle fill="currentColor" cx={128} cy={128} r={18} />
    </svg>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <header className="site-header">
          <div className="inner">
            <Link href="/" className="brand">
              <BrandMark />
              <span>مناد</span>
              <span className="tagline">گفتگوی انسان با حقیقت</span>
            </Link>
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
