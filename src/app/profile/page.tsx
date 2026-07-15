import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMyConversations } from '@/core/usecases/auth/get-my-conversations';
import { getContainer } from '@/infrastructure/container';
import { currentUserServer } from '@/lib/auth';
import { NameEditor } from './name-editor';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'پروفایل' };

const dateFormat = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' });

const STATUS_LABEL: Record<string, string> = {
  active: 'در جریان',
  published: 'منتشرشده',
  private: 'خصوصی',
};

export default async function ProfilePage() {
  const user = await currentUserServer();
  if (!user) redirect('/login');

  const conversations = getMyConversations(getContainer().repo, user.id);

  return (
    <>
      <h1 className="page-title">پروفایل</h1>

      <NameEditor initialName={user.displayName ?? ''} email={user.email} />

      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '2rem 0 1rem' }}>
        بایگانی گفتگوهای من
      </h2>
      <p style={{ color: 'var(--text-soft)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        این فهرست فقط برای توست. گفتگوهای منتشرشده در صفحه‌ی عمومی ناشناس می‌مانند.
      </p>

      {conversations.length === 0 ? (
        <div className="empty">
          <p>هنوز گفتگویی نداری.</p>
          <p>
            <Link href="/new">نخستین گفتگو را بیاغاز.</Link>
          </p>
        </div>
      ) : (
        conversations.map((c) => {
          const inner = (
            <>
              <h2>{c.title ?? 'گفتگوی بی‌عنوان'}</h2>
              <div className="meta">
                <span>{STATUS_LABEL[c.status] ?? c.status}</span>
                <span>{c.turns} پرسش</span>
                <span>
                  {dateFormat.format(new Date(c.publishedAt ?? c.createdAt))}
                </span>
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
          خروج از حساب
        </button>
      </form>
    </>
  );
}
