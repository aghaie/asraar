import { listAdminConversations } from '@/core/usecases/admin/admin-usecases';
import { getContainer } from '@/infrastructure/container';
import { currentLocale } from '@/lib/locale';
import { t } from '@/i18n/t';
import { ModerationTable } from './moderation-table';

export const dynamic = 'force-dynamic';

/** نظارتِ محتوا — فهرستِ همه‌ی گفتگوها با کنش‌های نظارتی (ADR-0026). */
export default async function AdminConversationsPage() {
  const { repo } = getContainer();
  const locale = await currentLocale();
  const rows = listAdminConversations({ repo }, 200);

  return (
    <div>
      <h2 className="admin-h2">{t(locale, 'admin.conv.title')}</h2>
      <p className="admin-sub">{t(locale, 'admin.conv.note')}</p>
      <ModerationTable rows={rows} locale={locale} />
    </div>
  );
}
