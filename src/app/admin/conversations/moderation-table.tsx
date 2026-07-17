'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useT } from '@/i18n/provider';
import { formatDate } from '@/lib/format-date';
import type { MessageKey } from '@/i18n/t';
import type { AdminConversationRow } from '@/core/domain/admin';

const STATUS_KEY: Record<AdminConversationRow['status'], MessageKey> = {
  published: 'admin.stat.published',
  active: 'admin.stat.active',
  private: 'admin.stat.private',
};

export function ModerationTable({
  rows,
  locale,
}: {
  rows: AdminConversationRow[];
  locale: string;
}) {
  const { t } = useT();
  const [items, setItems] = useState(rows);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, action: 'unpublish' | 'republish' | 'delete') {
    if (busy) return;
    if (action === 'delete' && !confirm(t('admin.conv.confirmDelete'))) return;
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/conversations/${id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => {
        if (action === 'delete') return prev.filter((r) => r.id !== id);
        const next: AdminConversationRow['status'] =
          action === 'unpublish' ? 'private' : 'published';
        return prev.map((r) => (r.id === id ? { ...r, status: next } : r));
      });
    } catch {
      setError(t('admin.conv.actionError'));
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return <p className="empty">{t('admin.conv.empty')}</p>;
  }

  return (
    <div className="admin-table-wrap">
      {error && <div className="notice error" style={{ marginBottom: '0.8rem' }}>{error}</div>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>{t('admin.conv.col.title')}</th>
            <th>{t('admin.conv.col.status')}</th>
            <th>{t('admin.conv.col.turns')}</th>
            <th>{t('admin.conv.col.date')}</th>
            <th>{t('admin.conv.col.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id} aria-busy={busy === r.id}>
              <td className="title-cell">
                {r.title || '—'}
                {r.parentId && <span className="tag">{t('admin.conv.branch')}</span>}
              </td>
              <td>
                <span className={`status-pill ${r.status}`}>{t(STATUS_KEY[r.status])}</span>
              </td>
              <td>{r.turns.toLocaleString(locale)}</td>
              <td className="date-cell">{formatDate(locale, r.createdAt)}</td>
              <td>
                <div className="row-actions">
                  {r.status === 'published' && (
                    <Link className="rowbtn" href={`/c/${r.id}`} target="_blank">
                      {t('admin.conv.view')}
                    </Link>
                  )}
                  {r.status === 'published' && (
                    <button
                      className="rowbtn"
                      disabled={busy === r.id}
                      onClick={() => void act(r.id, 'unpublish')}
                    >
                      {t('admin.conv.unpublish')}
                    </button>
                  )}
                  {r.status === 'private' && (
                    <button
                      className="rowbtn"
                      disabled={busy === r.id}
                      onClick={() => void act(r.id, 'republish')}
                    >
                      {t('admin.conv.republish')}
                    </button>
                  )}
                  <button
                    className="rowbtn danger"
                    disabled={busy === r.id}
                    onClick={() => void act(r.id, 'delete')}
                  >
                    {t('admin.conv.delete')}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
