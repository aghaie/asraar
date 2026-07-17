import { currentLocale } from '@/lib/locale';
import { t } from '@/i18n/t';

export const dynamic = 'force-dynamic';

/** درباره‌ی مناد — بیانِ ساده‌ی مأموریت، بنیانِ قرآنی و فروتنی. */
export default async function AboutPage() {
  const locale = await currentLocale();
  return (
    <>
      <h1 className="page-title">{t(locale, 'about.title')}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
        <p>{t(locale, 'about.p1')}</p>
        <p>{t(locale, 'about.p2')}</p>
        <p>{t(locale, 'about.p3')}</p>
        <p>{t(locale, 'about.p4')}</p>
        <p style={{ color: 'var(--text-soft)' }}>{t(locale, 'about.p5')}</p>
      </div>
    </>
  );
}
