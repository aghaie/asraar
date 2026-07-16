'use client';

import { useState } from 'react';
import { useT } from '@/i18n/provider';

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message ?? t('login.sendError'));
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.sendError'));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return <div className="notice">{t('login.sent')}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '24rem' }}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('login.emailPlaceholder')}
          aria-label={t('login.emailPlaceholder')}
          dir="ltr"
          required
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'var(--surface)',
            color: 'var(--text)',
            font: 'inherit',
            padding: '0.7rem 1rem',
          }}
        />
        <button className="btn" type="submit" disabled={busy || !email.trim()}>
          {t('login.sendLink')}
        </button>
      </form>

      {error && <div className="notice error">{error}</div>}

      {googleEnabled && (
        <>
          <div style={{ textAlign: 'center', color: 'var(--text-soft)', fontSize: '0.85rem' }}>
            {t('login.or')}
          </div>
          <a className="btn secondary" href="/api/auth/google">
            {t('login.google')}
          </a>
        </>
      )}
    </div>
  );
}
