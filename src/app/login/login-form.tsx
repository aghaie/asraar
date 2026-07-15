'use client';

import { useState } from 'react';

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
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
      if (!res.ok) throw new Error(data?.error?.message ?? 'ارسال نشد.');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ارسال نشد.');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="notice">
        اگر این ایمیل حسابی داشته باشد یا تازه باشد، لینک ورود برایت فرستاده شد. صندوق
        ورودی‌ات را ببین.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '24rem' }}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ایمیل تو"
          aria-label="ایمیل"
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
          فرستادن لینک ورود
        </button>
      </form>

      {error && <div className="notice error">{error}</div>}

      {googleEnabled && (
        <>
          <div style={{ textAlign: 'center', color: 'var(--text-soft)', fontSize: '0.85rem' }}>
            یا
          </div>
          <a className="btn secondary" href="/api/auth/google">
            ورود با گوگل
          </a>
        </>
      )}
    </div>
  );
}
