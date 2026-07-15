import { DomainError } from '@/core/domain/errors';
import type { ConversationRepository } from '@/core/ports/conversation-repository';

/** چسباندن یک گفتگوی ناشناسِ لوکال (با owner_token) به اکانت کاربر. */
export function claimConversation(
  repo: ConversationRepository,
  conversationId: string,
  ownerToken: string,
  userId: string,
): void {
  const ok = repo.claimConversation(conversationId, ownerToken, userId);
  if (!ok) {
    throw new DomainError('FORBIDDEN', 'این گفتگو قابل افزودن به حساب شما نیست.');
  }
}
