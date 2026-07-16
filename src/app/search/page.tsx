import Link from 'next/link';
import type { Metadata } from 'next';
import { searchPublishedConversations } from '@/core/usecases/search-published-conversations';
import { getContainer } from '@/infrastructure/container';
import { currentLocale } from '@/lib/locale';
import { ConversationCard } from '../_components/conversation-card';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'جست‌وجو' };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();

  const { repo, translationStore } = getContainer();
  const locale = await currentLocale();
  const results = query
    ? searchPublishedConversations({ repo, translationStore }, query, 50, locale)
    : [];

  return (
    <>
      <h1 className="page-title">جست‌وجو</h1>

      <form action="/search" method="get" className="search-form" role="search">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="جست‌وجو در گفتگوها…"
          aria-label="جست‌وجو در گفتگوها"
          autoFocus
        />
      </form>

      {query === '' ? (
        <div className="empty">
          <p>واژه‌ای برای جست‌وجو بنویس.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="empty">
          <p>برای «{query}» گفتگوی منتشرشده‌ای یافت نشد.</p>
          <p>
            <Link href="/">بازگشت به گفتگوها</Link>
          </p>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--text-soft)', marginBottom: '1rem' }}>
            {results.length} گفتگو برای «{query}»
          </p>
          {results.map((c) => (
            <ConversationCard key={c.id} c={c} />
          ))}
        </>
      )}
    </>
  );
}
