import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMyConversations } from '@/core/usecases/auth/get-my-conversations';
import { getContainer } from '@/infrastructure/container';
import { currentUserServer } from '@/lib/auth';
import { currentLocale } from '@/lib/locale';
import { t } from '@/i18n/t';
import { formatDate } from '@/lib/format-date';
import { LogoutIcon } from '../_components/icons';

import { NameEditor } from './name-editor';

export const dynamic = 'force-dynamic';

const STATUS_KEY = {
  active: 'profile.status.active',
  published: 'profile.status.published',
  private: 'profile.status.private',
} as const;

export default async function ProfilePage() {
  const user = await currentUserServer();
  if (!user) redirect('/login');
  const locale = await currentLocale();

  const conversations = getMyConversations(getContainer().repo, user.id);

  return (
    <>
      <h1 className="page-title">{t(locale, 'profile.title')}</h1>

      <NameEditor initialName={user.displayName ?? ''} email={user.email} />

      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '2rem 0 1rem' }}>
        {t(locale, 'profile.archive')}
      </h2>
      <p style={{ color: 'var(--text-soft)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        {t(locale, 'profile.archiveNote')}
      </p>

      {conversations.length === 0 ? (
        <div className="empty">
          <p>{t(locale, 'profile.empty')}</p>
          <p>
            <Link href="/new">{t(locale, 'profile.emptyCta')}</Link>
          </p>
        </div>
      ) : (
        conversations.map((c) => {
          const inner = (
            <>
              <h2>{c.title ?? t(locale, 'profile.untitled')}</h2>
              <div className="meta">
                <span>{t(locale, STATUS_KEY[c.status])}</span>
                <span>{t(locale, 'card.turns', { turns: c.turns })}</span>
                <span>{formatDate(locale, c.publishedAt ?? c.createdAt)}</span>
              </div>
            </>
          );
          return c.status === 'published' ? (
            <Link key={c.id} href={`/c/${c.id}`} className="card">
              {inner}
            </Link>
          ) : (
            <div key={c.id} className="card" style={{ cursor: 'default' }}>
              {inner}
            </div>
          );
        })
      )}

      <form action="/api/auth/logout" method="post" style={{ marginTop: '2.5rem' }}>
        <button className="btn quiet" type="submit">
          <LogoutIcon /> {t(locale, 'profile.logout')}
        </button>
      </form>
    </>
  );
}
