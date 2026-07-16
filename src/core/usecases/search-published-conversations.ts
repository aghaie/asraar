import type { PublishedSummary } from '../domain/conversation';
import { toFtsMatch } from '../domain/search-query';
import type { ConversationRepository } from '../ports/conversation-repository';
import type { TranslationStore } from '../ports/translator';
import { localize } from './list-published-conversations';

export interface SearchDeps {
  repo: ConversationRepository;
  translationStore?: TranslationStore;
}

/** جست‌وجوی تمام‌متن در گفتگوهای منتشرشده. ورودی خالی/نامعتبر → فهرست خالی. */
export function searchPublishedConversations(
  deps: SearchDeps,
  query: string,
  limit = 50,
  locale?: string,
): PublishedSummary[] {
  const match = toFtsMatch(query.slice(0, 200));
  if (match.length === 0) return [];
  return localize(deps.repo.search(match, limit), locale, deps.translationStore);
}
