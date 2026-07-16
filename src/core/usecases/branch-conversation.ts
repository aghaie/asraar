import type { Conversation, Message } from '../domain/conversation';
import { DomainError, notFound } from '../domain/errors';
import type { ConversationRepository } from '../ports/conversation-repository';
import type { RateLimiter } from '../ports/rate-limiter';

export interface BranchConversationDeps {
  repo: ConversationRepository;
  rateLimiter: RateLimiter;
  newId: () => string;
  newToken: () => string;
  now: () => Date;
}

export interface BranchConversationInput {
  parentId: string;
  /** تا کدام نوبت از والد به ارث برسد (شمارِ پیام‌ها از ابتدا) */
  branchPoint: number;
  clientKey: string;
  userId: string | null;
}

export interface BranchConversationResult {
  id: string;
  ownerToken: string;
}

/**
 * شاخه‌زدن (ADR-0022، اصل ۲): «این مسیر را ادامه بده» — خنثی، نه مخالفت.
 * پیشوندِ [۱..branchPoint]ِ والدِ منتشرشده در یک گفتگوی active تازه کلون می‌شود؛
 * سپس بیننده با send-message ادامه می‌دهد و مناد با آگاهیِ کامل از پیشوند پاسخ می‌دهد.
 */
export function branchConversation(
  deps: BranchConversationDeps,
  input: BranchConversationInput,
): BranchConversationResult {
  const parent = deps.repo.findById(input.parentId);
  if (!parent || parent.status !== 'published') throw notFound('گفتگو');

  const point = Math.trunc(input.branchPoint);
  if (point < 1 || point > parent.messages.length) {
    throw new DomainError('VALIDATION', 'نقطه‌ی شاخه‌خوردن نامعتبر است.');
  }

  const quota = deps.rateLimiter.consume(input.clientKey, 'conversation');
  if (!quota.allowed) {
    throw new DomainError(
      'RATE_LIMITED',
      'سهمیه‌ی گفتگوی امروز شما به پایان رسیده است. فردا بازگردید.',
    );
  }

  const at = deps.now().toISOString();
  const branch: Conversation = {
    id: deps.newId(),
    ownerToken: deps.newToken(),
    userId: input.userId,
    parentId: parent.id,
    branchPoint: point,
    title: null,
    status: 'active',
    messages: [],
    createdAt: at,
    publishedAt: null,
  };
  deps.repo.create(branch);

  // کلونِ پیشوندِ به‌ارث‌رسیده (فقط‌خواندنی؛ متنِ اصلی لازم نیست، این‌ها بازتولیدِ والدند).
  const inherited: Message[] = parent.messages.slice(0, point).map((m) => ({
    role: m.role,
    content: m.content,
    originalContent: null,
    createdAt: at,
  }));
  deps.repo.appendMessages(branch.id, inherited);

  // سیگنالِ معرفتیِ «شاخه ساختم» روی والد (اثر بر فهم؛ یک‌بار per کنشگر).
  deps.repo.recordEpistemicSignal(parent.id, 'created-branch', input.clientKey, at);

  return { id: branch.id, ownerToken: branch.ownerToken };
}
