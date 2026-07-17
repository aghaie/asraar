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

function SearchIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <circle cx={11} cy={11} r={7} />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x={3} y={4.5} width={18} height={16} rx={2} />
      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  );
}

/** بدنه‌ی صفحه‌ی «گفتگوهای ارزشمند» برای یک بازه‌ی زمانی مشخص. */
export async function ValuableConversations({ window }: { window: TimeWindow }) {
  const { repo, now, translationStore } = getContainer();
  const locale = await currentLocale();
  const conversations = listPublishedConversations(
    { repo, now, translationStore },
    { window, locale },
  );
  const activeTab = TABS.find((tb) => tb.window === window) ?? TABS[TABS.length - 1];

  return (
    <>
      <div className="page-head">
        <h1 className="page-title" style={{ margin: 0 }}>
          {t(locale, 'home.title')}
        </h1>
        <div className="head-tools">
          {/* جست‌وجو — آیکنی و مینیمال */}
          <details className="head-tool">
            <summary aria-label={t(locale, 'home.searchAria')}>
              <SearchIcon />
            </summary>
            <div className="head-pop">
              <form action="/search" method="get" role="search">
                <input
                  type="search"
                  name="q"
                  placeholder={t(locale, 'home.searchPlaceholder')}
                  aria-label={t(locale, 'home.searchAria')}
                  autoFocus
                />
              </form>
            </div>
          </details>

          {/* بازه‌ی زمانی — آیکنی و مینیمال */}
          <details className="head-tool">
            <summary aria-label={t(locale, 'tabs.aria')}>
              <CalendarIcon />
              <span className="head-tool-label">{t(locale, activeTab.key)}</span>
            </summary>
            <div className="head-pop menu" role="menu">
              {TABS.map((tab) => (
                <Link
                  key={tab.window}
                  href={windowHref(tab.window)}
                  className={tab.window === window ? 'active' : undefined}
                >
                  {t(locale, tab.key)}
                </Link>
              ))}
            </div>
          </details>
        </div>
      </div>

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
