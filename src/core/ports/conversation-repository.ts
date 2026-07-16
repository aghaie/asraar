import type {
  BranchSummary,
  Conversation,
  ConversationStatus,
  Message,
  PublishedSummary,
} from '../domain/conversation';
import type { EpistemicSignalKind, SignalCounts } from '../domain/epistemic-signal';
import type { OwnedConversationSummary } from '../domain/user';

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

  /**
   * ثبت سیگنالِ معرفتی (ADR-0022، اصل ۳): «اثر بر فهم»، نه محبوبیت.
   * هر کنشگر برای هر گفتگو هر نوع سیگنال را فقط یک بار.
   */
  recordEpistemicSignal(
    conversationId: string,
    kind: EpistemicSignalKind,
    actorKey: string,
    at: string,
  ): 'recorded' | 'duplicate';
  /** شمارِ سیگنال‌های معرفتیِ یک گفتگو (برای صفحه‌ی گفتگو). */
  signalCounts(conversationId: string): SignalCounts;

  /** فهرستِ شاخه‌های منتشرشده‌ی یک گفتگو (درختِ شاخه‌ها). */
  listBranches(parentId: string): BranchSummary[];

  /** بایگانی خصوصی کاربر: همه‌ی گفتگوهای او (هر وضعیتی)، جدیدترین اول. */
  listByUser(userId: string): OwnedConversationSummary[];
  /**
   * چسباندن یک گفتگوی ناشناس به اکانت، با اثبات مالکیت (owner_token).
   * فقط اگر گفتگو هنوز به کاربری وصل نباشد. true اگر انجام شد.
   */
  claimConversation(conversationId: string, ownerToken: string, userId: string): boolean;
}
