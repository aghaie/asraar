import Link from 'next/link';
import { searchPublishedConversations } from '@/core/usecases/search-published-conversations';
import { getContainer } from '@/infrastructure/container';
import { currentLocale } from '@/lib/locale';
import { t } from '@/i18n/t';
import { ConversationCard } from '../_components/conversation-card';

export const dynamic = 'force-dynamic';

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
      <h1 className="page-title">{t(locale, 'search.title')}</h1>

      <form action="/search" method="get" className="search-form" role="search">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={t(locale, 'home.searchPlaceholder')}
          aria-label={t(locale, 'home.searchAria')}
          autoFocus
        />
      </form>

      {query === '' ? (
        <div className="empty">
          <p>{t(locale, 'search.empty')}</p>
        </div>
      ) : results.length === 0 ? (
        <div className="empty">
          <p>{t(locale, 'search.noResults', { query })}</p>
          <p>
            <Link href="/">{t(locale, 'search.back')}</Link>
          </p>
        </div>
      ) : (
        <>
          <p style={{ color: 'var(--text-soft)', marginBottom: '1rem' }}>
            {t(locale, 'search.count', { count: results.length, query })}
          </p>
          {results.map((c) => (
            <ConversationCard key={c.id} c={c} locale={locale} />
          ))}
        </>
      )}
    </>
  );
}
