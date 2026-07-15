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
  listPublished(limit: number): PublishedSummary[];
  /** ثبت سیگنال ارزش؛ هر بیننده برای هر گفتگو فقط یک بار. */
  recordValueSignal(
    conversationId: string,
    voterKey: string,
    valuable: boolean,
    at: string,
  ): 'recorded' | 'duplicate';
}
