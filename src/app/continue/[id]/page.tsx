'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChatSession, type ChatInitial } from '../../_components/chat-session';
import { ownerTokenKey } from '@/lib/branch-token';
import { useT } from '@/i18n/provider';

export default function ContinuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useT();
  const [initial, setInitial] = useState<ChatInitial | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // توکنِ مالکیت اگر در این مرورگر ذخیره شده باشد (جریانِ ناشناس/شاخه)؛
    // وگرنه بارگذاری با هویتِ نشستِ کاربرِ واردشده انجام می‌شود.
    const ownerToken =
      typeof window !== 'undefined' ? localStorage.getItem(ownerTokenKey(id)) : null;
    (async () => {
      try {
        const res = await fetch(`/api/conversations/${id}/load`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(ownerToken ? { ownerToken } : {}),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error?.message ?? t('continue.loadError'));
        setInitial({
          id,
          ownerToken: ownerToken ?? '',
          messages: data.messages,
          inheritedCount: data.branchPoint ?? 0,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : t('continue.loadError'));
      }
    })();
  }, [id, t]);

  if (error) {
    return (
      <div className="notice error">
        <p>{error}</p>
        <p style={{ marginTop: '0.5rem' }}>
          <Link href="/">{t('published.back')}</Link>
        </p>
      </div>
    );
  }
  if (!initial) {
    return <p style={{ color: 'var(--text-soft)' }}>{t('continue.loading')}</p>;
  }

  return <ChatSession titleKey="continue.title" initial={initial} />;
}
