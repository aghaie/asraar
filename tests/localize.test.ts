import { describe, expect, it } from 'vitest';
import { localize } from '@/core/usecases/list-published-conversations';
import type { PublishedSummary } from '@/core/domain/conversation';
import { InMemoryTranslationStore } from './helpers/in-memory';

const summary: PublishedSummary = {
  id: 'c1',
  title: 'حقیقت چیست؟',
  excerpt: 'پاسخِ فارسی…',
  turns: 2,
  impact: 3,
  understoodCount: 1,
  publishedAt: '2026-07-16T09:00:00Z',
};

describe('localize (ADR-0022، اصل ۸ — ترجمه‌ی تنبل از کش)', () => {
  it('بدون locale یا store، دست‌نخورده برمی‌گرداند', () => {
    expect(localize([summary], undefined, undefined)).toEqual([summary]);
  });

  it('اگر ترجمه‌ی کش‌شده نباشد، اصل می‌ماند (هیچ ترجمه‌ی تازه‌ای ساخته نمی‌شود)', () => {
    const store = new InMemoryTranslationStore();
    expect(localize([summary], 'en', store)[0].title).toBe('حقیقت چیست؟');
  });

  it('اگر ترجمه‌ی کش‌شده باشد، عنوان و گزیده جایگزین می‌شوند', () => {
    const store = new InMemoryTranslationStore();
    store.save(
      'c1',
      {
        lang: 'en',
        title: 'What is truth?',
        messages: [
          { role: 'seeker', content: 'What is truth?' },
          { role: 'monad', content: 'A good question…' },
        ],
      },
      '2026-07-16T10:00:00Z',
    );
    const out = localize([summary], 'en', store)[0];
    expect(out.title).toBe('What is truth?');
    expect(out.excerpt).toBe('A good question…');
  });
});
