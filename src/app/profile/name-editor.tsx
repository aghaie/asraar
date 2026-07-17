'use client';

import { useState } from 'react';
import { useT } from '@/i18n/provider';
import { CheckIcon } from '../_components/icons';

export function NameEditor({
  initialName,
  email,
}: {
  initialName: string;
  email: string | null;
}) {
  const { t } = useT();
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !name.trim()) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/profile/name', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message ?? t('profile.saveError'));
      setName(data.name as string);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.saveError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {email && (
        <div style={{ color: 'var(--text-soft)', fontSize: '0.85rem' }} dir="ltr">
          {email}
        </div>
      )}
      <form onSubmit={save} className="actions" style={{ alignItems: 'stretch' }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('profile.namePlaceholder')}
          aria-label={t('profile.nameAria')}
          maxLength={40}
          style={{
            flex: '1 1 12rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: 'var(--surface)',
            color: 'var(--text)',
            font: 'inherit',
            padding: '0.55rem 0.9rem',
          }}
        />
        <button className="btn secondary" type="submit" disabled={busy || !name.trim()}>
          <CheckIcon /> {t('profile.saveName')}
        </button>
      </form>
      {saved && (
        <div style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>{t('profile.saved')}</div>
      )}
      {error && <div className="notice error">{error}</div>}
    </div>
  );
}
