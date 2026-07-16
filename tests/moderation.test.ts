import { describe, expect, it } from 'vitest';
import { parseModeration } from '@/infrastructure/moderation/llm-content-moderator';
import { finishConversation } from '@/core/usecases/finish-conversation';
import { startConversation } from '@/core/usecases/start-conversation';
import { sendMessage } from '@/core/usecases/send-message';
import { StubContentModerator, testDeps } from './helpers/in-memory';

describe('parseModeration', () => {
  it('اجازه را می‌خواند', () => {
    expect(parseModeration('{"allow": true}')).toEqual({ allow: true, reason: null });
  });
  it('رد به‌همراه دلیل را می‌خواند', () => {
    expect(parseModeration('{"allow": false, "reason": "توهین"}')).toEqual({
      allow: false,
      reason: 'توهین',
    });
  });
  it('حصار کد را نادیده می‌گیرد', () => {
    expect(parseModeration('```json\n{"allow": true}\n```')).toEqual({
      allow: true,
      reason: null,
    });
  });
  it('خروجی خراب خطا می‌دهد (تا fail-open در آداپتر رخ دهد)', () => {
    expect(() => parseModeration('not json')).toThrow();
  });
});

describe('نگهبان کرامت هنگام انتشار', () => {
  async function withOneMessage(deps: ReturnType<typeof testDeps>, content: string) {
    const { id, ownerToken } = startConversation(deps, 'ip-1');
    await sendMessage(deps, { conversationId: id, ownerToken, content, clientKey: 'ip-1' });
    return { id, ownerToken };
  }

  it('انتشار محتوای رد‌شده را با CONTENT_REJECTED بلاک می‌کند و منتشر نمی‌شود', async () => {
    const deps = testDeps();
    deps.contentModerator = new StubContentModerator({ allow: false, reason: 'توهین.' });
    const { id, ownerToken } = await withOneMessage(deps, 'یک پیام');
    await expect(
      finishConversation(deps, { conversationId: id, ownerToken, publish: true }),
    ).rejects.toMatchObject({ code: 'CONTENT_REJECTED' });
    // گفتگو همچنان فعال است (منتشر نشده) تا کاربر بتواند خصوصی نگه دارد
    expect(deps.repo.findById(id)!.status).toBe('active');
  });

  it('خصوصی‌ماندن هرگز داوری نمی‌شود (حتی اگر نگهبان رد کند)', async () => {
    const deps = testDeps();
    deps.contentModerator = new StubContentModerator({ allow: false, reason: 'x' });
    const { id, ownerToken } = await withOneMessage(deps, 'یک پیام');
    const result = await finishConversation(deps, { conversationId: id, ownerToken, publish: false });
    expect(result.status).toBe('private');
  });

  it('پرسش صادقانه با تأیید نگهبان منتشر می‌شود', async () => {
    const deps = testDeps(); // Stub پیش‌فرض: اجازه
    const { id, ownerToken } = await withOneMessage(deps, 'حقیقت چیست؟');
    const result = await finishConversation(deps, { conversationId: id, ownerToken, publish: true });
    expect(result.status).toBe('published');
  });
});
