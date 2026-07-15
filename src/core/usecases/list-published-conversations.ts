import type { PublishedSummary } from '../domain/conversation';
import { rank } from '../domain/ranking';
import { windowRange, type TimeWindow } from '../domain/time-window';
import type { ConversationRepository } from '../ports/conversation-repository';

export interface ListPublishedDeps {
  repo: ConversationRepository;
  now: () => Date;
}

export interface ListPublishedOptions {
  window?: TimeWindow;
  limit?: number;
}

/** صفحه‌ی اصلی: گفتگوهای ارزشمند، نه افراد ارزشمند. با بازه‌ی زمانی اختیاری. */
export function listPublishedConversations(
  deps: ListPublishedDeps,
  options: ListPublishedOptions = {},
): PublishedSummary[] {
  const { window = 'all', limit = 50 } = options;
  const now = deps.now();
  const { sinceIso, untilIso } = windowRange(window, now);

  // برای MVP، رتبه‌بندی در حافظه انجام می‌شود؛ با رشد داده به ستون score ازپیش‌محاسبه منتقل می‌شود.
  const candidates = deps.repo.listPublished(500, sinceIso, untilIso);
  return rank(candidates, now).slice(0, limit);
}
