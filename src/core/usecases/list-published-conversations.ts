import type { PublishedSummary } from '../domain/conversation';
import { rank } from '../domain/ranking';
import type { ConversationRepository } from '../ports/conversation-repository';

export interface ListPublishedDeps {
  repo: ConversationRepository;
  now: () => Date;
}

/** صفحه‌ی اصلی: گفتگوهای ارزشمند، نه افراد ارزشمند. */
export function listPublishedConversations(
  deps: ListPublishedDeps,
  limit = 50,
): PublishedSummary[] {
  // برای MVP، رتبه‌بندی در حافظه انجام می‌شود؛ با رشد داده به ستون score ازپیش‌محاسبه منتقل می‌شود.
  const candidates = deps.repo.listPublished(500);
  return rank(candidates, deps.now()).slice(0, limit);
}
