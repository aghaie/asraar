import { serviceHealth } from '@/lib/health';
import { currentLocale } from '@/lib/locale';
import { t } from '@/i18n/t';

export const dynamic = 'force-dynamic';

/** سلامتِ پیکربندیِ نمونه‌ی زنده (ADR-0026) — برای اطمینان هنگام استقرار. */
export default async function AdminHealthPage() {
  const locale = await currentLocale();
  const items = serviceHealth();

  return (
    <div>
      <h2 className="admin-h2">{t(locale, 'admin.health.title')}</h2>
      <p className="admin-sub">{t(locale, 'admin.health.note')}</p>
      <ul className="health-list">
        {items.map((it) => (
          <li key={it.labelKey} className="health-row">
            <span className={`health-dot ${it.level}`} aria-hidden="true" />
            <span className="health-label">{t(locale, it.labelKey)}</span>
            <span className={`health-val ${it.level}`}>
              {it.valueText ?? (it.valueKey ? t(locale, it.valueKey) : '')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
