import type { Conversation } from '../domain/conversation';
import { DomainError } from '../domain/errors';
import type { ConversationRepository } from '../ports/conversation-repository';
import type { RateLimiter } from '../ports/rate-limiter';

export interface StartConversationDeps {
  repo: ConversationRepository;
  rateLimiter: RateLimiter;
  newId: () => string;
  newToken: () => string;
  now: () => Date;
}

export interface StartConversationResult {
  id: string;
  ownerToken: string;
  remainingToday: number;
}

/**
 * آغاز یک گفتگوی تازه — بدون ثبت‌نام، فقط با سهمیه‌ی روزانه.
 * userId اختیاری است: اگر کاربر وارد شده باشد، گفتگو به بایگانی خصوصی او وصل می‌شود.
 */
export function startConversation(
  deps: StartConversationDeps,
  clientKey: string,
  userId: string | null = null,
): StartConversationResult {
  const quota = deps.rateLimiter.consume(clientKey, 'conversation');
  if (!quota.allowed) {
    throw new DomainError(
      'RATE_LIMITED',
      'سهمیه‌ی گفتگوی امروز شما به پایان رسیده است. فردا بازگردید.',
    );
  }

  const conversation: Conversation = {
    id: deps.newId(),
    ownerToken: deps.newToken(),
    userId,
    title: null,
    status: 'active',
    messages: [],
    valueUp: 0,
    valueDown: 0,
    createdAt: deps.now().toISOString(),
    publishedAt: null,
  };
  deps.repo.create(conversation);

  return {
    id: conversation.id,
    ownerToken: conversation.ownerToken,
    remainingToday: quota.remaining,
  };
}
