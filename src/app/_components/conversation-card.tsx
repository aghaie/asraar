import Link from 'next/link';
import type { PublishedSummary } from '@/core/domain/conversation';
import { t } from '@/i18n/t';

/** کارت یک گفتگوی منتشرشده — مشترک میان صفحه‌ی اصلی و جست‌وجو. */
export function ConversationCard({ c, locale }: { c: PublishedSummary; locale: string }) {
  const dateFormat = new Intl.DateTimeFormat(`${locale}`, { dateStyle: 'medium' });
  return (
    <Link href={`/c/${c.id}`} className="card">
      <h2>{c.title}</h2>
      <p>{c.excerpt}</p>
      <div className="meta">
        <span>{t(locale, 'card.turns', { turns: c.turns })}</span>
        {c.understoodCount > 0 && (
          <span>{t(locale, 'card.understood', { count: c.understoodCount })}</span>
        )}
        <span>{formatDate(dateFormat, c.publishedAt)}</span>
      </div>
    </Link>
  );
}

function formatDate(fmt: Intl.DateTimeFormat, iso: string): string {
  try {
    return fmt.format(new Date(iso));
  } catch {
    return new Date(iso).toISOString().slice(0, 10);
  }
}
