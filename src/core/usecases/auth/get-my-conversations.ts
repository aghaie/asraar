import type { OwnedConversationSummary } from '@/core/domain/user';
import type { ConversationRepository } from '@/core/ports/conversation-repository';

/** بایگانی خصوصی کاربر — همه‌ی گفتگوهای خودش (منتشرشده و خصوصی). */
export function getMyConversations(
  repo: ConversationRepository,
  userId: string,
): OwnedConversationSummary[] {
  return repo.listByUser(userId);
}
