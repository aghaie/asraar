import { describe, expect, it } from 'vitest';
import { canManage } from '@/core/domain/conversation';
import { startConversation } from '@/core/usecases/start-conversation';
import { sendMessage } from '@/core/usecases/send-message';
import { finishConversation } from '@/core/usecases/finish-conversation';
import { testDeps } from './helpers/in-memory';

describe('canManage — مالکیت با توکن یا هویت', () => {
  const conv = { ownerToken: 'tok-abc', userId: 'user-1' };

  it('توکنِ درست را می‌پذیرد', () => {
    expect(canManage(conv, { ownerToken: 'tok-abc' })).toBe(true);
  });
  it('هویتِ کاربرِ مالک را می‌پذیرد (بدونِ توکن)', () => {
    expect(canManage(conv, { userId: 'user-1' })).toBe(true);
  });
  it('توکنِ غلط و کاربرِ دیگر را رد می‌کند', () => {
    expect(canManage(conv, { ownerToken: 'x', userId: 'user-2' })).toBe(false);
    expect(canManage(conv, {})).toBe(false);
  });
  it('گفتگوی ناشناس (userId=null) با userId خالی مالک نمی‌شود', () => {
    expect(canManage({ ownerToken: 't', userId: null }, { userId: null })).toBe(false);
  });
});

describe('بازیابیِ گفتگوی نیمه‌تمام با هویتِ کاربر (بدونِ ownerToken)', () => {
  it('کاربرِ مالک می‌تواند بدونِ توکن پیام دهد و گفتگو را پایان دهد', async () => {
    const deps = testDeps();
    const { id } = startConversation(deps, 'client-1', 'user-1');

    // بدونِ ownerToken، فقط با userId
    const sent = await sendMessage(deps, {
      conversationId: id,
      userId: 'user-1',
      content: 'ادامه‌ی گفتگو',
      clientKey: 'client-1',
    });
    expect(sent.turns).toBe(1);

    const done = await finishConversation(deps, {
      conversationId: id,
      userId: 'user-1',
      publish: false,
    });
    expect(done.status).toBe('private');
  });

  it('کاربرِ دیگر بدونِ توکن نمی‌تواند گفتگو را دستکاری کند', async () => {
    const deps = testDeps();
    const { id } = startConversation(deps, 'client-1', 'user-1');
    await expect(
      sendMessage(deps, {
        conversationId: id,
        userId: 'user-2',
        content: 'نفوذ',
        clientKey: 'client-2',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
