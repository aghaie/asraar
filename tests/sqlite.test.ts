import { describe, expect, it } from 'vitest';
import { openDatabase } from '@/infrastructure/db/database';
import { SqliteConversationRepository } from '@/infrastructure/repositories/sqlite-conversation-repository';
import { SqliteRateLimiter } from '@/infrastructure/rate-limit/sqlite-rate-limiter';
import { SqliteTranslationStore } from '@/infrastructure/translations/sqlite-translation-store';
import type { Conversation } from '@/core/domain/conversation';

function makeConversation(id: string): Conversation {
  return {
    id,
    ownerToken: `token-${id}`,
    title: null,
    status: 'active',
    messages: [],
    valueUp: 0,
    valueDown: 0,
    createdAt: '2026-07-15T10:00:00Z',
    publishedAt: null,
  };
}

describe('SqliteConversationRepository', () => {
  it('چرخه‌ی کامل: ساخت، پیام، انتشار، فهرست، سیگنال ارزش', () => {
    const db = openDatabase(':memory:');
    const repo = new SqliteConversationRepository(db);

    repo.create(makeConversation('c1'));
    repo.appendMessages('c1', [
      { role: 'seeker', content: 'حقیقت چیست؟', originalContent: null, createdAt: '2026-07-15T10:01:00Z' },
      { role: 'monad', content: 'پرسش خوبی است…', originalContent: null, createdAt: '2026-07-15T10:01:30Z' },
    ]);

    const loaded = repo.findById('c1')!;
    expect(loaded.messages).toHaveLength(2);
    expect(loaded.messages[0].content).toBe('حقیقت چیست؟');

    repo.finish(
      'c1',
      'published',
      'حقیقت چیست؟',
      loaded.messages,
      '2026-07-15T11:00:00Z',
    );

    const list = repo.listPublished(10);
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe('حقیقت چیست؟');
    expect(list[0].turns).toBe(1);

    expect(repo.recordValueSignal('c1', 'viewer-1', true, '2026-07-15T12:00:00Z')).toBe('recorded');
    expect(repo.recordValueSignal('c1', 'viewer-1', false, '2026-07-15T12:01:00Z')).toBe('duplicate');
    expect(repo.findById('c1')!.valueUp).toBe(1);
    expect(repo.findById('c1')!.valueDown).toBe(0);
  });

  it('جست‌وجوی FTS و فیلتر بازه‌ی زمانی', () => {
    const db = openDatabase(':memory:');
    const repo = new SqliteConversationRepository(db);

    function publish(id: string, title: string, body: string, at: string) {
      repo.create(makeConversation(id));
      const msgs = [
        { role: 'seeker' as const, content: title, originalContent: null, createdAt: at },
        { role: 'monad' as const, content: body, originalContent: null, createdAt: at },
      ];
      repo.appendMessages(id, msgs);
      repo.finish(id, 'published', title, msgs, at);
    }

    publish('a', 'معنای آزادی چیست؟', 'آزادی یعنی رهایی از بندگی غیر خدا', '2026-07-16T09:00:00Z');
    publish('b', 'عدالت چیست؟', 'عدالت نهادن هر چیز در جای خود است', '2026-07-10T09:00:00Z');

    // جست‌وجو
    expect(repo.search('"آزادی"*', 10).map((r) => r.id)).toEqual(['a']);
    expect(repo.search('"عدالت"*', 10).map((r) => r.id)).toEqual(['b']);
    expect(repo.search('"ققنوس"*', 10)).toHaveLength(0);

    // بازه‌ی زمانی: فقط از ۱۵ ژوئیه به بعد
    const recent = repo.listPublished(10, '2026-07-15T00:00:00Z', null);
    expect(recent.map((r) => r.id)).toEqual(['a']);
  });
});

describe('SqliteRateLimiter', () => {
  it('سهمیه‌ی روزانه را درست می‌شمارد', () => {
    const db = openDatabase(':memory:');
    const limiter = new SqliteRateLimiter(db, { conversation: 2, message: 5, translation: 1 });

    expect(limiter.consume('k1', 'conversation')).toEqual({ allowed: true, remaining: 1 });
    expect(limiter.consume('k1', 'conversation')).toEqual({ allowed: true, remaining: 0 });
    expect(limiter.consume('k1', 'conversation').allowed).toBe(false);
    // اقدام دیگر و کلید دیگر مستقل‌اند
    expect(limiter.consume('k1', 'message').allowed).toBe(true);
    expect(limiter.consume('k2', 'conversation').allowed).toBe(true);
  });
});

describe('SqliteTranslationStore', () => {
  it('ترجمه را ذخیره و بازیابی می‌کند', () => {
    const db = openDatabase(':memory:');
    const repo = new SqliteConversationRepository(db);
    repo.create(makeConversation('c1'));
    const store = new SqliteTranslationStore(db);

    expect(store.find('c1', 'en')).toBeNull();
    store.save(
      'c1',
      { lang: 'en', title: 'What is truth?', messages: [{ role: 'seeker', content: 'What is truth?' }] },
      '2026-07-15T12:00:00Z',
    );
    const found = store.find('c1', 'en')!;
    expect(found.title).toBe('What is truth?');
    expect(found.messages[0].content).toBe('What is truth?');
  });
});
