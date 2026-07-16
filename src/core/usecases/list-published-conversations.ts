import { excerptFromMessages, type PublishedSummary } from '../domain/conversation';
import { rank } from '../domain/ranking';
import { windowRange, type TimeWindow } from '../domain/time-window';
import type { ConversationRepository } from '../ports/conversation-repository';
import type { TranslationStore } from '../ports/translator';

export interface ListPublishedDeps {
  repo: ConversationRepository;
  now: () => Date;
  /** برای ترجمه‌ی تنبلِ عنوان/گزیده به زبانِ کاربر (فقط از کش؛ بدون مصرف سهمیه). */
  translationStore?: TranslationStore;
}

export interface ListPublishedOptions {
  window?: TimeWindow;
  limit?: number;
  /** زبانِ کاربر؛ اگر داده شود و ترجمه‌ی کش‌شده موجود باشد، عنوان/گزیده جایگزین می‌شود. */
  locale?: string;
}

/** صفحه‌ی اصلی: گفتگوهای ارزشمند، نه افراد ارزشمند. با بازه‌ی زمانی و زبانِ اختیاری. */
export function listPublishedConversations(
  deps: ListPublishedDeps,
  options: ListPublishedOptions = {},
): PublishedSummary[] {
  const { window = 'all', limit = 50, locale } = options;
  const now = deps.now();
  const { sinceIso, untilIso } = windowRange(window, now);

  // برای MVP، رتبه‌بندی در حافظه انجام می‌شود؛ با رشد داده به ستون score ازپیش‌محاسبه منتقل می‌شود.
  const candidates = deps.repo.listPublished(500, sinceIso, untilIso);
  const ranked = rank(candidates, now).slice(0, limit);
  return localize(ranked, locale, deps.translationStore);
}

/**
 * جایگزینیِ عنوان/گزیده با نسخه‌ی ترجمه‌شده اگر برای این زبان کش شده باشد (ADR-0022، اصل ۸).
 * تنبل: هیچ ترجمه‌ی تازه‌ای این‌جا ساخته نمی‌شود؛ فقط از کش استفاده می‌شود.
 */
export function localize(
  summaries: PublishedSummary[],
  locale: string | undefined,
  store: TranslationStore | undefined,
): PublishedSummary[] {
  if (!locale || !store) return summaries;
  return summaries.map((s) => {
    const cached = store.find(s.id, locale);
    if (!cached) return s;
    return { ...s, title: cached.title, excerpt: excerptFromMessages(cached.messages) };
  });
}
