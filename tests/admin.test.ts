import { describe, expect, it } from 'vitest';
import {
  adminOverview,
  deleteConversationAdmin,
  isModerationAction,
  listAdminConversations,
  moderate,
  republishConversation,
  unpublishConversation,
} from '@/core/usecases/admin/admin-usecases';
import { startConversation } from '@/core/usecases/start-conversation';
import { sendMessage } from '@/core/usecases/send-message';
import { finishConversation } from '@/core/usecases/finish-conversation';
import { testDeps } from './helpers/in-memory';

async function publishOne(deps: ReturnType<typeof testDeps>, actor = 'author') {
  const { id, ownerToken } = startConversation(deps, actor);
  await sendMessage(deps, { conversationId: id, ownerToken, content: 'پرسش', clientKey: actor });
  await finishConversation(deps, { conversationId: id, ownerToken, publish: true });
  return id;
}

describe('پنل مدیریت (ADR-0026)', () => {
  it('adminOverview شمارگانِ درست می‌دهد', async () => {
    const deps = testDeps();
    await publishOne(deps);
    await publishOne(deps);
    const s = adminOverview(deps);
    expect(s.conversations.total).toBe(2);
    expect(s.conversations.published).toBe(2);
  });

  it('unpublish گفتگو را از انتشار خارج و republish بازمی‌گرداند', async () => {
    const deps = testDeps();
    const id = await publishOne(deps);
    unpublishConversation(deps, id);
    expect(deps.repo.findById(id)!.status).toBe('private');
    republishConversation(deps, id);
    expect(deps.repo.findById(id)!.status).toBe('published');
  });

  it('delete گفتگو را کاملاً حذف می‌کند', async () => {
    const deps = testDeps();
    const id = await publishOne(deps);
    deleteConversationAdmin(deps, id);
    expect(deps.repo.findById(id)).toBeNull();
    expect(listAdminConversations(deps)).toHaveLength(0);
  });

  it('moderate کنشِ نام‌برده را اجرا می‌کند', async () => {
    const deps = testDeps();
    const id = await publishOne(deps);
    moderate(deps, id, 'unpublish');
    expect(deps.repo.findById(id)!.status).toBe('private');
  });

  it('isModerationAction فقط کنش‌های مجاز را می‌پذیرد', () => {
    expect(isModerationAction('delete')).toBe(true);
    expect(isModerationAction('ban')).toBe(false);
    expect(isModerationAction(42)).toBe(false);
  });
});
