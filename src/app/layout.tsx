import type { Metadata } from 'next';
import Link from 'next/link';
import { currentUserServer } from '@/lib/auth';
import { currentLocale, isRtlLocale } from '@/lib/locale';
import { t } from '@/i18n/t';
import { dictionaryFor } from '@/i18n/t';
import { I18nProvider } from '@/i18n/provider';
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
        <I18nProvider locale={locale} messages={dictionaryFor(locale)}>
          <header className="site-header">
            <div className="inner">
              <Link href="/" className="brand">
                <BrandMark />
                <span>{t(locale, 'brand')}</span>
                <span className="tagline">{t(locale, 'tagline')}</span>
              </Link>
              <nav className="nav">
                <Link href="/new">{t(locale, 'nav.new')}</Link>
                <Link href="/about">{t(locale, 'nav.about')}</Link>
                {user ? (
                  <Link href="/profile">{user.displayName ?? t(locale, 'nav.profile')}</Link>
                ) : (
                  <Link href="/login">{t(locale, 'nav.login')}</Link>
                )}
                <LanguageSwitcher locale={locale} />
              </nav>
            </div>
          </header>
          <main className="container">{children}</main>
          <footer className="site-footer">
            <div>{t(locale, 'footer')}</div>
            <div style={{ marginTop: '0.5rem' }}>
              <Link href="/updates">{t(locale, 'nav.updates')}</Link>
              {' · '}
              <Link href="/about">{t(locale, 'nav.about')}</Link>
            </div>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
