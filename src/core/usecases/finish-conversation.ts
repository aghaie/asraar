import { deriveTitle, type Message } from '../domain/conversation';
import { DomainError, forbidden, notFound } from '../domain/errors';
import { normalizeForPublication, normalizePersian } from '../domain/normalize';
import type { ConversationRepository } from '../ports/conversation-repository';

export interface FinishConversationDeps {
  repo: ConversationRepository;
  now: () => Date;
}

export interface FinishConversationInput {
  conversationId: string;
  ownerToken: string;
  /** true: انتشار برای همه‌ی جهان — false: خصوصی می‌ماند */
  publish: boolean;
}

/**
 * پایان گفتگو به انتخاب جوینده: انتشار یا خصوصی ماندن.
 * هنگام انتشار، متن‌ها نگارش‌شده و نسخه‌ی اصلیِ تغییر‌یافته‌ها حفظ می‌شود.
 */
export function finishConversation(
  deps: FinishConversationDeps,
  input: FinishConversationInput,
): { status: 'published' | 'private' } {
  const conversation = deps.repo.findById(input.conversationId);
  if (!conversation) throw notFound('گفتگو');
  if (conversation.ownerToken !== input.ownerToken) throw forbidden();
  if (conversation.status !== 'active') {
    throw new DomainError('CONVERSATION_CLOSED', 'این گفتگو قبلاً پایان یافته است.');
  }
  if (conversation.messages.length === 0) {
    throw new DomainError('VALIDATION', 'گفتگوی خالی را نمی‌توان پایان داد.');
  }

  if (!input.publish) {
    deps.repo.finish(conversation.id, 'private', null, null, null);
    return { status: 'private' };
  }

  const normalizedMessages: Message[] = conversation.messages.map((m) => {
    if (m.role === 'monad') {
      // پاسخ مناد فقط از نظر نویسه یکسان‌سازی می‌شود؛ متن اصلی لازم نیست.
      return { ...m, content: normalizePersian(m.content) };
    }
    const { content, originalContent } = normalizeForPublication(m.content);
    return { ...m, content, originalContent };
  });

  const firstQuestion = normalizedMessages.find((m) => m.role === 'seeker');
  const title = deriveTitle(firstQuestion?.content ?? 'گفتگو');

  deps.repo.finish(
    conversation.id,
    'published',
    title,
    normalizedMessages,
    deps.now().toISOString(),
  );
  return { status: 'published' };
}
