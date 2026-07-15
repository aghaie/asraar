import { describe, expect, it } from 'vitest';
import { DomainError } from '@/core/domain/errors';
import { LIMITS } from '@/core/domain/conversation';
import { finishConversation } from '@/core/usecases/finish-conversation';
import { getTranslatedConversation } from '@/core/usecases/get-translated-conversation';
import { listPublishedConversations } from '@/core/usecases/list-published-conversations';
import { recordValueSignal } from '@/core/usecases/record-value-signal';
import { sendMessage } from '@/core/usecases/send-message';
import { startConversation } from '@/core/usecases/start-conversation';
import { testDeps } from './helpers/in-memory';

function expectDomainError(fn: () => unknown, code: string) {
  try {
    fn();
    expect.unreachable('انتظار خطا می‌رفت');
  } catch (e) {
    expect(e).toBeInstanceOf(DomainError);
    expect((e as DomainError).code).toBe(code);
  }
}

describe('startConversation', () => {
  it('گفتگوی تازه با توکن مالکیت می‌سازد', () => {
    const deps = testDeps();
    const result = startConversation(deps, 'client-1');
    expect(result.id).toBeTruthy();
    expect(result.ownerToken).toBeTruthy();
    expect(deps.repo.findById(result.id)?.status).toBe('active');
  });

  it('پس از پایان سهمیه‌ی روزانه، RATE_LIMITED می‌دهد', () => {
    const deps = testDeps();
    startConversation(deps, 'client-1');
    startConversation(deps, 'client-1');
    expectDomainError(() => startConversation(deps, 'client-1'), 'RATE_LIMITED');
  });
});

describe('sendMessage', () => {
  it('پیام جوینده و پاسخ مناد را ثبت می‌کند', async () => {
    const deps = testDeps();
    const { id, ownerToken } = startConversation(deps, 'client-1');
    const result = await sendMessage(deps, {
      conversationId: id,
      ownerToken,
      content: 'حقیقت چیست؟',
      clientKey: 'client-1',
    });
    expect(result.reply).toBe('پاسخ آزمایشی مناد');
    expect(result.turns).toBe(1);
    const saved = deps.repo.findById(id)!;
    expect(saved.messages).toHaveLength(2);
    expect(saved.messages[0].role).toBe('seeker');
    expect(saved.messages[1].role).toBe('monad');
  });

  it('توکن نادرست را رد می‌کند', async () => {
    const deps = testDeps();
    const { id } = startConversation(deps, 'client-1');
    await expect(
      sendMessage(deps, {
        conversationId: id,
        ownerToken: 'wrong',
        content: 'سلام',
        clientKey: 'client-1',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('پیام خالی و پیام بیش از حد بلند را رد می‌کند', async () => {
    const deps = testDeps();
    const { id, ownerToken } = startConversation(deps, 'client-1');
    const base = { conversationId: id, ownerToken, clientKey: 'client-1' };
    await expect(sendMessage(deps, { ...base, content: '   ' })).rejects.toMatchObject({
      code: 'VALIDATION',
    });
    await expect(
      sendMessage(deps, { ...base, content: 'ا'.repeat(LIMITS.maxMessageChars + 1) }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  it('روی گفتگوی پایان‌یافته پیام نمی‌پذیرد', async () => {
    const deps = testDeps();
    const { id, ownerToken } = startConversation(deps, 'client-1');
    await sendMessage(deps, {
      conversationId: id,
      ownerToken,
      content: 'پرسش',
      clientKey: 'client-1',
    });
    finishConversation(deps, { conversationId: id, ownerToken, publish: false });
    await expect(
      sendMessage(deps, {
        conversationId: id,
        ownerToken,
        content: 'ادامه؟',
        clientKey: 'client-1',
      }),
    ).rejects.toMatchObject({ code: 'CONVERSATION_CLOSED' });
  });
});

describe('sendMessage — streaming', () => {
  it('با موتور جریانی، دلتاها می‌رسند و متن کامل ذخیره می‌شود', async () => {
    const deps = testDeps();
    deps.engine.replyStream = async (
      _history: unknown,
      onDelta: (t: string) => void,
    ) => {
      onDelta('سلام ');
      onDelta('جوینده');
      return 'سلام جوینده';
    };
    const { id, ownerToken } = startConversation(deps, 'client-1');
    const deltas: string[] = [];
    const result = await sendMessage(
      deps,
      { conversationId: id, ownerToken, content: 'سلام', clientKey: 'client-1' },
      (t) => deltas.push(t),
    );
    expect(deltas).toEqual(['سلام ', 'جوینده']);
    expect(result.reply).toBe('سلام جوینده');
    expect(deps.repo.findById(id)!.messages[1].content).toBe('سلام جوینده');
  });

  it('موتور بدون استریم: fallback یک دلتا با متن کامل می‌دهد', async () => {
    const deps = testDeps();
    const { id, ownerToken } = startConversation(deps, 'client-1');
    const deltas: string[] = [];
    await sendMessage(
      deps,
      { conversationId: id, ownerToken, content: 'سلام', clientKey: 'client-1' },
      (t) => deltas.push(t),
    );
    expect(deltas).toEqual(['پاسخ آزمایشی مناد']);
  });
});

describe('finishConversation', () => {
  it('هنگام انتشار، متن را نگارش می‌کند و نسخه‌ی اصلی را نگه می‌دارد', async () => {
    const deps = testDeps();
    const { id, ownerToken } = startConversation(deps, 'client-1');
    await sendMessage(deps, {
      conversationId: id,
      ownerToken,
      content: 'من می خواهم حقیقت را بدانم',
      clientKey: 'client-1',
    });
    const result = finishConversation(deps, { conversationId: id, ownerToken, publish: true });
    expect(result.status).toBe('published');

    const published = deps.repo.findById(id)!;
    expect(published.title).toBe('من می‌خواهم حقیقت را بدانم');
    expect(published.messages[0].content).toBe('من می‌خواهم حقیقت را بدانم');
    expect(published.messages[0].originalContent).toBe('من می خواهم حقیقت را بدانم');
    expect(published.publishedAt).toBeTruthy();
  });

  it('گفتگوی خالی را نمی‌بندد', () => {
    const deps = testDeps();
    const { id, ownerToken } = startConversation(deps, 'client-1');
    expectDomainError(
      () => finishConversation(deps, { conversationId: id, ownerToken, publish: true }),
      'VALIDATION',
    );
  });

  it('خصوصی ماندن، گفتگو را از فهرست عمومی بیرون نگه می‌دارد', async () => {
    const deps = testDeps();
    const { id, ownerToken } = startConversation(deps, 'client-1');
    await sendMessage(deps, {
      conversationId: id,
      ownerToken,
      content: 'پرسش خصوصی',
      clientKey: 'client-1',
    });
    finishConversation(deps, { conversationId: id, ownerToken, publish: false });
    expect(listPublishedConversations(deps)).toHaveLength(0);
  });
});

describe('recordValueSignal', () => {
  async function publishedConversation(deps: ReturnType<typeof testDeps>) {
    const { id, ownerToken } = startConversation(deps, 'author');
    await sendMessage(deps, {
      conversationId: id,
      ownerToken,
      content: 'پرسش',
      clientKey: 'author',
    });
    finishConversation(deps, { conversationId: id, ownerToken, publish: true });
    return id;
  }

  it('هر بیننده فقط یک بار می‌تواند نظر بدهد', async () => {
    const deps = testDeps();
    const id = await publishedConversation(deps);
    recordValueSignal(deps, id, 'viewer-1', true);
    expectDomainError(() => recordValueSignal(deps, id, 'viewer-1', false), 'DUPLICATE_SIGNAL');
    expect(deps.repo.findById(id)!.valueUp).toBe(1);
  });

  it('روی گفتگوی منتشر‌نشده نظر ثبت نمی‌شود', () => {
    const deps = testDeps();
    const { id } = startConversation(deps, 'author');
    expectDomainError(() => recordValueSignal(deps, id, 'viewer-1', true), 'NOT_FOUND');
  });
});

describe('getTranslatedConversation', () => {
  async function publishedConversation(deps: ReturnType<typeof testDeps>) {
    const { id, ownerToken } = startConversation(deps, 'author');
    await sendMessage(deps, {
      conversationId: id,
      ownerToken,
      content: 'حقیقت چیست؟',
      clientKey: 'author',
    });
    finishConversation(deps, { conversationId: id, ownerToken, publish: true });
    return id;
  }

  it('گفتگو را ترجمه می‌کند و بار دوم از کش می‌خواند', async () => {
    const deps = testDeps();
    const id = await publishedConversation(deps);
    const first = await getTranslatedConversation(deps, id, 'en', 'viewer-1');
    expect(first.title).toBe('[en] حقیقت چیست؟');
    expect(first.messages).toHaveLength(2);
    expect(deps.translator.calls).toBe(1);

    await getTranslatedConversation(deps, id, 'en', 'viewer-2');
    expect(deps.translator.calls).toBe(1);
  });

  it('کد زبان نامعتبر را رد می‌کند', async () => {
    const deps = testDeps();
    const id = await publishedConversation(deps);
    await expect(
      getTranslatedConversation(deps, id, 'abc!', 'viewer-1'),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});
