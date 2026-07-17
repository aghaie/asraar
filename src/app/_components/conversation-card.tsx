import Link from 'next/link';
import type { PublishedSummary } from '@/core/domain/conversation';
import { t } from '@/i18n/t';
import { formatDate } from '@/lib/format-date';

/** کارت یک گفتگوی منتشرشده — مشترک میان صفحه‌ی اصلی و جست‌وجو. */
export function ConversationCard({ c, locale }: { c: PublishedSummary; locale: string }) {
  return (
    <Link href={`/c/${c.id}`} className="card">
      <h2>{c.title}</h2>
      <p>{c.excerpt}</p>
      <div className="meta">
        <span>{t(locale, 'card.turns', { turns: c.turns })}</span>
        {c.understoodCount > 0 && (
          <span>{t(locale, 'card.understood', { count: c.understoodCount })}</span>
        )}
        <span>{formatDate(locale, c.publishedAt)}</span>
      </div>
    </Link>
  );
}
