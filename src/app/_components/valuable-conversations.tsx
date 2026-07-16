import Link from 'next/link';
import { listPublishedConversations } from '@/core/usecases/list-published-conversations';
import type { TimeWindow } from '@/core/domain/time-window';
import { getContainer } from '@/infrastructure/container';
import { ConversationCard } from './conversation-card';

/** مسیرِ تمیزِ هر بازه؛ «همه» روی صفحه‌ی اصلی (/) است. */
export function windowHref(window: TimeWindow): string {
  return window === 'all' ? '/' : `/${window}`;
}

const TABS: { window: TimeWindow; label: string }[] = [
  { window: 'day', label: 'امروز' },
  { window: 'yesterday', label: 'دیروز' },
  { window: 'week', label: 'این هفته' },
  { window: 'month', label: 'این ماه' },
  { window: 'year', label: 'امسال' },
  { window: 'all', label: 'همه' },
];

/** بدنه‌ی صفحه‌ی «گفتگوهای ارزشمند» برای یک بازه‌ی زمانی مشخص. */
export function ValuableConversations({ window }: { window: TimeWindow }) {
  const { repo, now } = getContainer();
  const conversations = listPublishedConversations({ repo, now }, { window });

  return (
    <>
      <h1 className="page-title">گفتگوهای ارزشمند</h1>

      <form action="/search" method="get" className="search-form" role="search">
        <input
          type="search"
          name="q"
          placeholder="جست‌وجو در گفتگوها…"
          aria-label="جست‌وجو در گفتگوها"
        />
      </form>

      <nav className="tabs" aria-label="بازه‌ی زمانی">
        {TABS.map((tab) => (
          <Link
            key={tab.window}
            href={windowHref(tab.window)}
            className={tab.window === window ? 'tab active' : 'tab'}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {conversations.length === 0 ? (
        <div className="empty">
          <p>در این بازه گفتگوی منتشرشده‌ای نیست.</p>
          <p>
            <Link href="/new">گفتگویی تازه بیاغاز.</Link>
          </p>
        </div>
      ) : (
        conversations.map((c) => <ConversationCard key={c.id} c={c} />)
      )}
    </>
  );
}
