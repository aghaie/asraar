import Link from 'next/link';
import type { PublishedSummary } from '@/core/domain/conversation';

const dateFormat = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' });

/** کارت یک گفتگوی منتشرشده — مشترک میان صفحه‌ی اصلی و جست‌وجو. */
export function ConversationCard({ c }: { c: PublishedSummary }) {
  return (
    <Link href={`/c/${c.id}`} className="card">
      <h2>{c.title}</h2>
      <p>{c.excerpt}</p>
      <div className="meta">
        <span>{c.turns} پرسش</span>
        <span>{c.valueUp} نفر گفتند ارزشمند بود</span>
        <span>{dateFormat.format(new Date(c.publishedAt))}</span>
      </div>
    </Link>
  );
}
