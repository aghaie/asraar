import { adminOverview } from '@/core/usecases/admin/admin-usecases';
import { getContainer } from '@/infrastructure/container';
import { currentLocale } from '@/lib/locale';
import { t, type MessageKey } from '@/i18n/t';

export const dynamic = 'force-dynamic';

/** داشبوردِ مدیریت — شمارگانِ معرفتی، نه محبوبیتی (ADR-0026). */
export default async function AdminOverviewPage() {
  const { repo } = getContainer();
  const locale = await currentLocale();
  const s = adminOverview({ repo });

  const cards: { key: MessageKey; value: number }[] = [
    { key: 'admin.stat.conversations', value: s.conversations.total },
    { key: 'admin.stat.published', value: s.conversations.published },
    { key: 'admin.stat.active', value: s.conversations.active },
    { key: 'admin.stat.private', value: s.conversations.private },
    { key: 'admin.stat.users', value: s.users },
    { key: 'admin.stat.signals', value: s.signals },
    { key: 'admin.stat.branches', value: s.branches },
    { key: 'admin.stat.last7', value: s.publishedLast7Days },
  ];

  return (
    <div className="admin-stats">
      {cards.map((c) => (
        <div key={c.key} className="admin-stat">
          <div className="num">{c.value.toLocaleString(locale)}</div>
          <div className="label">{t(locale, c.key)}</div>
        </div>
      ))}
    </div>
  );
}
