import Link from 'next/link';
import { requireAdmin } from '@/lib/admin';
import { currentLocale } from '@/lib/locale';
import { t } from '@/i18n/t';

export const dynamic = 'force-dynamic';

/** بخشِ مدیریت (ADR-0026) — همه‌ی زیرصفحه‌ها پشتِ گاردِ requireAdmin. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const locale = await currentLocale();
  return (
    <section className="admin">
      <div className="admin-head">
        <h1 className="page-title" style={{ marginBottom: '0.3rem' }}>
          {t(locale, 'admin.title')}
        </h1>
        <p className="admin-sub">{t(locale, 'admin.subtitle')}</p>
        <nav className="admin-nav">
          <Link href="/admin">{t(locale, 'admin.nav.overview')}</Link>
          <Link href="/admin/conversations">{t(locale, 'admin.nav.conversations')}</Link>
        </nav>
      </div>
      {children}
    </section>
  );
}
