import Link from 'next/link';
import { listPublishedConversations } from '@/core/usecases/list-published-conversations';
import { getContainer } from '@/infrastructure/container';

export const dynamic = 'force-dynamic';

const dateFormat = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' });

export default function HomePage() {
  const { repo, now } = getContainer();
  const conversations = listPublishedConversations({ repo, now });

  return (
    <>
      <h1 className="page-title">گفتگوهای ارزشمند</h1>
      {conversations.length === 0 ? (
        <div className="empty">
          <p>هنوز گفتگویی منتشر نشده است.</p>
          <p>
            <Link href="/new">نخستین گفتگو را تو بیاغاز.</Link>
          </p>
        </div>
      ) : (
        conversations.map((c) => (
          <Link key={c.id} href={`/c/${c.id}`} className="card">
            <h2>{c.title}</h2>
            <p>{c.excerpt}</p>
            <div className="meta">
              <span>{c.turns} پرسش</span>
              <span>{c.valueUp} نفر گفتند ارزشمند بود</span>
              <span>{dateFormat.format(new Date(c.publishedAt))}</span>
            </div>
          </Link>
        ))
      )}
    </>
  );
}
