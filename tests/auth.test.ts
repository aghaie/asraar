import { describe, expect, it } from 'vitest';
import { DomainError } from '@/core/domain/errors';
import {
  completeEmailLogin,
  logout,
  requestEmailLogin,
  setDisplayName,
  userFromSession,
  type AuthDeps,
} from '@/core/usecases/auth/auth-service';
import { getMyConversations } from '@/core/usecases/auth/get-my-conversations';
import { claimConversation } from '@/core/usecases/auth/claim-conversation';
import { startConversation } from '@/core/usecases/start-conversation';
import { finishConversation } from '@/core/usecases/finish-conversation';
import { sendMessage } from '@/core/usecases/send-message';
import type { EmailSender } from '@/core/ports/email-sender';
import { testDeps } from './helpers/in-memory';

class CapturingEmail implements EmailSender {
  readonly name = 'capture';
  lastUrl: string | null = null;
  async sendMagicLink(_email: string, url: string): Promise<void> {
    this.lastUrl = url;
  }
}

function authDeps(base = testDeps()) {
  const email = new CapturingEmail();
  const deps: AuthDeps = {
    identity: base.identity,
    email,
    rateLimiter: base.rateLimiter,
    newId: base.newId,
    newToken: base.newToken,
    hash: (v) => `hash(${v})`,
    now: base.now,
    appUrl: 'http://localhost:3000',
  };
  return { deps, email, base };
}

function tokenFromUrl(url: string): string {
  return new URL(url).searchParams.get('token')!;
}

describe('ورود با لینک جادویی', () => {
  it('چرخه‌ی کامل: درخواست → لینک → نشست → کاربر', async () => {
    const { deps, email } = authDeps();
    await requestEmailLogin(deps, 'Ali@Example.com', 'ip-1');
    expect(email.lastUrl).toBeTruthy();

    const token = tokenFromUrl(email.lastUrl!);
    const sessionToken = completeEmailLogin(deps, token);
    const user = userFromSession(deps, sessionToken);
    expect(user?.email).toBe('ali@example.com'); // نرمال‌شده
  });

  it('لینک جادویی یک‌بارمصرف است', async () => {
    const { deps, email } = authDeps();
    await requestEmailLogin(deps, 'a@b.com', 'ip-1');
    const token = tokenFromUrl(email.lastUrl!);
    completeEmailLogin(deps, token);
    expect(() => completeEmailLogin(deps, token)).toThrow(DomainError);
  });

  it('ورود دوم با همان ایمیل، همان کاربر است', async () => {
    const { deps, email } = authDeps();
    await requestEmailLogin(deps, 'a@b.com', 'ip-1');
    const s1 = completeEmailLogin(deps, tokenFromUrl(email.lastUrl!));
    await requestEmailLogin(deps, 'a@b.com', 'ip-1');
    const s2 = completeEmailLogin(deps, tokenFromUrl(email.lastUrl!));
    expect(userFromSession(deps, s1)?.id).toBe(userFromSession(deps, s2)?.id);
  });

  it('ایمیل نامعتبر رد می‌شود', async () => {
    const { deps } = authDeps();
    await expect(requestEmailLogin(deps, 'not-an-email', 'ip-1')).rejects.toMatchObject({
      code: 'VALIDATION',
    });
  });

  it('خروج، نشست را باطل می‌کند', async () => {
    const { deps, email } = authDeps();
    await requestEmailLogin(deps, 'a@b.com', 'ip-1');
    const s = completeEmailLogin(deps, tokenFromUrl(email.lastUrl!));
    expect(userFromSession(deps, s)).not.toBeNull();
    logout(deps, s);
    expect(userFromSession(deps, s)).toBeNull();
  });

  it('نام نمایشی ذخیره می‌شود', async () => {
    const { deps, email } = authDeps();
    await requestEmailLogin(deps, 'a@b.com', 'ip-1');
    const s = completeEmailLogin(deps, tokenFromUrl(email.lastUrl!));
    const user = userFromSession(deps, s)!;
    const name = setDisplayName(deps, user.id, '  علی  ');
    expect(name).toBe('علی');
    expect(userFromSession(deps, s)?.displayName).toBe('علی');
  });
});

describe('بایگانی خصوصی و claim', () => {
  it('گفتگوی کاربرِ واردشده در بایگانی او دیده می‌شود', async () => {
    const base = testDeps();
    const { deps, email } = authDeps(base);
    await requestEmailLogin(deps, 'a@b.com', 'ip-1');
    const s = completeEmailLogin(deps, tokenFromUrl(email.lastUrl!));
    const userId = userFromSession(deps, s)!.id;

    const { id } = startConversation(base, 'ip-1', userId);
    expect(getMyConversations(base.repo, userId).map((c) => c.id)).toEqual([id]);
  });

  it('claim یک گفتگوی ناشناس آن را به کاربر می‌چسباند (و دوباره ممکن نیست)', async () => {
    const base = testDeps();
    const { deps, email } = authDeps(base);
    await requestEmailLogin(deps, 'a@b.com', 'ip-1');
    const s = completeEmailLogin(deps, tokenFromUrl(email.lastUrl!));
    const userId = userFromSession(deps, s)!.id;

    const { id, ownerToken } = startConversation(base, 'ip-1', null); // ناشناس
    expect(getMyConversations(base.repo, userId)).toHaveLength(0);

    claimConversation(base.repo, id, ownerToken, userId);
    expect(getMyConversations(base.repo, userId).map((c) => c.id)).toEqual([id]);

    expect(() => claimConversation(base.repo, id, ownerToken, userId)).toThrow(DomainError);
  });

  it('بایگانی هم گفتگوی خصوصی و هم منتشرشده را نشان می‌دهد', async () => {
    const base = testDeps();
    const { deps, email } = authDeps(base);
    await requestEmailLogin(deps, 'a@b.com', 'ip-1');
    const s = completeEmailLogin(deps, tokenFromUrl(email.lastUrl!));
    const userId = userFromSession(deps, s)!.id;

    const conv = startConversation(base, 'ip-1', userId);
    await sendMessage(base, {
      conversationId: conv.id,
      ownerToken: conv.ownerToken,
      content: 'پرسش',
      clientKey: 'ip-1',
    });
    await finishConversation(base, { conversationId: conv.id, ownerToken: conv.ownerToken, publish: false });

    const mine = getMyConversations(base.repo, userId);
    expect(mine).toHaveLength(1);
    expect(mine[0].status).toBe('private');
  });
});
