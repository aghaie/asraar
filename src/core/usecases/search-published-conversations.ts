import type { PublishedSummary } from '../domain/conversation';
import { toFtsMatch } from '../domain/search-query';
import type { ConversationRepository } from '../ports/conversation-repository';

export interface SearchDeps {
  repo: ConversationRepository;
}

/** جست‌وجوی تمام‌متن در گفتگوهای منتشرشده. ورودی خالی/نامعتبر → فهرست خالی. */
export function searchPublishedConversations(
  deps: SearchDeps,
  query: string,
  limit = 50,
): PublishedSummary[] {
  const match = toFtsMatch(query.slice(0, 200));
  if (match.length === 0) return [];
  return deps.repo.search(match, limit);
}
