import type {
  Conversation,
  ConversationStatus,
  Message,
  PublishedSummary,
} from '../domain/conversation';

/** پورت مخزن گفتگوها — پیاده‌سازی فعلی SQLite است و بعداً بدون تغییر Core عوض می‌شود. */
export interface ConversationRepository {
  create(conversation: Conversation): void;
  findById(id: string): Conversation | null;
  appendMessages(id: string, messages: Message[]): void;
  /** پایان گفتگو: تعیین وضعیت نهایی و در صورت انتشار، جایگزینی پیام‌های نگارش‌شده */
  finish(
    id: string,
    status: Extract<ConversationStatus, 'published' | 'private'>,
    title: string | null,
    normalizedMessages: Message[] | null,
    publishedAt: string | null,
  ): void;
  /**
   * فهرست گفتگوهای منتشرشده، جدیدترین اول.
   * sinceIso/untilIso بازه‌ی اختیاری بر published_at را محدود می‌کنند (برای بازه‌های زمانی).
   */
  listPublished(limit: number, sinceIso?: string | null, untilIso?: string | null): PublishedSummary[];
  /** جست‌وجوی تمام‌متنِ گفتگوهای منتشرشده؛ match باید عبارت امنِ FTS5 باشد. */
  search(match: string, limit: number): PublishedSummary[];
  /** ثبت سیگنال ارزش؛ هر بیننده برای هر گفتگو فقط یک بار. */
  recordValueSignal(
    conversationId: string,
    voterKey: string,
    valuable: boolean,
    at: string,
  ): 'recorded' | 'duplicate';
}
