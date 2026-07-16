import { describe, expect, it } from 'vitest';
import { branchConversation } from '@/core/usecases/branch-conversation';
import { startConversation } from '@/core/usecases/start-conversation';
import { sendMessage } from '@/core/usecases/send-message';
import { finishConversation } from '@/core/usecases/finish-conversation';
import { DomainError } from '@/core/domain/errors';
import { testDeps } from './helpers/in-memory';

async function publishTwoTurns(deps: ReturnType<typeof testDeps>) {
  const { id, ownerToken } = startConversation(deps, 'author');
  await sendMessage(deps, { conversationId: id, ownerToken, content: 'پرسش ۱', clientKey: 'author' });
  await sendMessage(deps, { conversationId: id, ownerToken, content: 'پرسش ۲', clientKey: 'author' });
  await finishConversation(deps, { conversationId: id, ownerToken, publish: true });
  return id;
}

describe('branchConversation (ADR-0022، اصل ۲ — «این مسیر را ادامه بده»)', () => {
  it('پیشوندِ به‌ارث‌رسیده را کلون می‌کند و شاخه‌ی active می‌سازد', async () => {
    const deps = testDeps();
    const parentId = await publishTwoTurns(deps); // ۴ پیام: s,m,s,m

    const branch = branchConversation(deps, {
      parentId,
      branchPoint: 2, // تا پایانِ نوبتِ اول
      clientKey: 'viewer',
      userId: null,
    });

    const b = deps.repo.findById(branch.id)!;
    expect(b.status).toBe('active');
    expect(b.parentId).toBe(parentId);
    expect(b.branchPoint).toBe(2);
    expect(b.messages).toHaveLength(2); // پیشوندِ به‌ارث‌رسیده
    expect(b.messages[0].content).toBe('پرسش ۱');
  });

  it('ادامه‌ی شاخه، مناد را با آگاهی از پیشوند صدا می‌زند و پاسخ می‌افزاید', async () => {
    const deps = testDeps();
    const parentId = await publishTwoTurns(deps);
    const branch = branchConversation(deps, { parentId, branchPoint: 2, clientKey: 'v', userId: null });

    await sendMessage(deps, {
      conversationId: branch.id,
      ownerToken: branch.ownerToken,
      content: 'حالا از این زاویه بپرسم…',
      clientKey: 'v',
    });
    const b = deps.repo.findById(branch.id)!;
    expect(b.messages).toHaveLength(4); // ۲ ارثی + ۱ پرسش + ۱ پاسخ
    // موتور، پیشوند را در history دید
    expect(deps.engine.calls[0][0].content).toBe('پرسش ۱');
  });

  it('شاخه‌ی منتشرشده در listBranchesِ والد دیده می‌شود', async () => {
    const deps = testDeps();
    const parentId = await publishTwoTurns(deps);
    const branch = branchConversation(deps, { parentId, branchPoint: 4, clientKey: 'v', userId: null });
    await sendMessage(deps, { conversationId: branch.id, ownerToken: branch.ownerToken, content: 'ادامه', clientKey: 'v' });
    await finishConversation(deps, { conversationId: branch.id, ownerToken: branch.ownerToken, publish: true });

    const branches = deps.repo.listBranches(parentId);
    expect(branches.map((b) => b.id)).toEqual([branch.id]);
    expect(branches[0].branchPoint).toBe(4);
  });

  it('شاخه‌زدن، سیگنالِ معرفتیِ created-branch روی والد ثبت می‌کند', async () => {
    const deps = testDeps();
    const parentId = await publishTwoTurns(deps);
    branchConversation(deps, { parentId, branchPoint: 2, clientKey: 'v', userId: null });
    expect(deps.repo.signalCounts(parentId)['created-branch']).toBe(1);
  });

  it('نقطه‌ی شاخه‌ی نامعتبر رد می‌شود', async () => {
    const deps = testDeps();
    const parentId = await publishTwoTurns(deps);
    expect(() =>
      branchConversation(deps, { parentId, branchPoint: 99, clientKey: 'v', userId: null }),
    ).toThrow(DomainError);
  });

  it('از گفتگوی منتشرنشده نمی‌توان شاخه زد', () => {
    const deps = testDeps();
    const { id } = startConversation(deps, 'author');
    expect(() =>
      branchConversation(deps, { parentId: id, branchPoint: 1, clientKey: 'v', userId: null }),
    ).toThrow(DomainError);
  });

  it('شاخه بدونِ نوبتِ تازه (فقط پیشوندِ ارثی) منتشر نمی‌شود', async () => {
    const deps = testDeps();
    const parentId = await publishTwoTurns(deps);
    const branch = branchConversation(deps, { parentId, branchPoint: 2, clientKey: 'v', userId: null });
    // بدونِ افزودنِ پرسشِ تازه:
    await expect(
      finishConversation(deps, {
        conversationId: branch.id,
        ownerToken: branch.ownerToken,
        publish: true,
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});
