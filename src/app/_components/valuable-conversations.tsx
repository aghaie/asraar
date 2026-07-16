import Link from 'next/link';
import { listPublishedConversations } from '@/core/usecases/list-published-conversations';
import type { TimeWindow } from '@/core/domain/time-window';
import { getContainer } from '@/infrastructure/container';
import { currentLocale } from '@/lib/locale';
import { t } from '@/i18n/t';
import { ConversationCard } from './conversation-card';

/** مسیرِ تمیزِ هر بازه؛ «همه» روی صفحه‌ی اصلی (/) است. */
export function windowHref(window: TimeWindow): string {
  return window === 'all' ? '/' : `/${window}`;
}

const TABS: { window: TimeWindow; key: `tabs.${TimeWindow}` }[] = [
  { window: 'day', key: 'tabs.day' },
  { window: 'yesterday', key: 'tabs.yesterday' },
  { window: 'week', key: 'tabs.week' },
  { window: 'month', key: 'tabs.month' },
  { window: 'year', key: 'tabs.year' },
  { window: 'all', key: 'tabs.all' },
];

/** بدنه‌ی صفحه‌ی «گفتگوهای ارزشمند» برای یک بازه‌ی زمانی مشخص. */
export async function ValuableConversations({ window }: { window: TimeWindow }) {
  const { repo, now, translationStore } = getContainer();
  const locale = await currentLocale();
  const conversations = listPublishedConversations(
    { repo, now, translationStore },
    { window, locale },
  );

  return (
    <>
      <h1 className="page-title">{t(locale, 'home.title')}</h1>

      <form action="/search" method="get" className="search-form" role="search">
        <input
          type="search"
          name="q"
          placeholder={t(locale, 'home.searchPlaceholder')}
          aria-label={t(locale, 'home.searchAria')}
        />
      </form>

      <nav className="tabs" aria-label={t(locale, 'tabs.aria')}>
        {TABS.map((tab) => (
          <Link
            key={tab.window}
            href={windowHref(tab.window)}
            className={tab.window === window ? 'tab active' : 'tab'}
          >
            {t(locale, tab.key)}
          </Link>
        ))}
      </nav>

      {conversations.length === 0 ? (
        <div className="empty">
          <p>{t(locale, 'home.empty')}</p>
          <p>
            <Link href="/new">{t(locale, 'home.emptyCta')}</Link>
          </p>
        </div>
      ) : (
        conversations.map((c) => <ConversationCard key={c.id} c={c} locale={locale} />)
      )}
    </>
  );
}
