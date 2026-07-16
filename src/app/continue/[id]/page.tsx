'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChatSession, type ChatInitial } from '../../_components/chat-session';
import { ownerTokenKey } from '@/lib/branch-token';

export default function ContinuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [initial, setInitial] = useState<ChatInitial | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ownerToken =
      typeof window !== 'undefined' ? localStorage.getItem(ownerTokenKey(id)) : null;
    if (!ownerToken) {
      setError('این مسیر برای تو در دسترس نیست. از صفحه‌ی گفتگو دوباره «این مسیر را ادامه بده» را بزن.');
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/conversations/${id}/load`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ownerToken }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error?.message ?? 'بارگذاری نشد.');
        setInitial({
          id,
          ownerToken,
          messages: data.messages,
          inheritedCount: data.branchPoint ?? data.messages.length,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'بارگذاری نشد.');
      }
    })();
  }, [id]);

  if (error) {
    return (
      <div className="notice error">
        <p>{error}</p>
        <p style={{ marginTop: '0.5rem' }}>
          <Link href="/">بازگشت به گفتگوها</Link>
        </p>
      </div>
    );
  }
  if (!initial) {
    return <p style={{ color: 'var(--text-soft)' }}>در حال بارگذاری…</p>;
  }

  return <ChatSession title="ادامه‌ی این مسیر" initial={initial} />;
}
