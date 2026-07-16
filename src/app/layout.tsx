import type { Metadata } from 'next';
import Link from 'next/link';
import { currentUserServer } from '@/lib/auth';
import { currentLocale, isRtlLocale } from '@/lib/locale';
import { LanguageSwitcher } from './_components/language-switcher';
import './globals.css';

export const dynamic = 'force-dynamic';

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, locale] = await Promise.all([currentUserServer(), currentLocale()]);
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
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
              <Link href="/gift">هدیه</Link>
              {user ? (
                <Link href="/profile">{user.displayName ?? 'پروفایل'}</Link>
              ) : (
                <Link href="/login">ورود</Link>
              )}
              <LanguageSwitcher locale={locale} />
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
