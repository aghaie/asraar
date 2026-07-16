/**
 * مدل دامنه‌ی مناد.
 * تنها گفتگوی موجود در سیستم: جوینده (انسان) ↔ مناد.
 * این ماژول به هیچ فریمورک، پایگاه داده یا مدل زبانی وابسته نیست.
 */

export type MessageRole = 'seeker' | 'monad';

export interface Message {
  role: MessageRole;
  /** متن نمایش‌داده‌شده (پس از انتشار: نسخه‌ی نگارش‌شده) */
  content: string;
  /** متن اصلی کاربر پیش از نرمال‌سازی؛ فقط وقتی با content فرق داشته باشد */
  originalContent: string | null;
  createdAt: string;
}

export type ConversationStatus = 'active' | 'published' | 'private';

export interface Conversation {
  id: string;
  /** توکن مالکیت؛ تنها راه ادامه یا پایان دادن به گفتگو. هویت ثبت‌نامی وجود ندارد. */
  ownerToken: string;
  /** اگر کاربر هنگام آغاز وارد بوده باشد، شناسه‌ی او؛ وگرنه null (ناشناس). */
  userId: string | null;
  /** اگر شاخه‌ای از گفتگوی دیگر باشد، شناسه‌ی والد (ADR-0022، اصل ۲)؛ وگرنه null. */
  parentId: string | null;
  /** شمارِ پیام‌های به‌ارث‌رسیده از والد (نقطه‌ی شاخه‌خوردن)؛ null اگر شاخه نباشد. */
  branchPoint: number | null;
  title: string | null;
  status: ConversationStatus;
  messages: Message[];
  createdAt: string;
  publishedAt: string | null;
}

/** خلاصه‌ی یک شاخه‌ی منتشرشده برای نمایش در «درختِ شاخه‌ها». */
export interface BranchSummary {
  id: string;
  title: string;
  branchPoint: number;
  turns: number;
  publishedAt: string;
}

/**
 * خلاصه‌ی یک گفتگوی منتشرشده برای فهرست/کارت.
 * ADR-0022 (اصل ۳): محبوبیت اندازه گرفته نمی‌شود؛ فقط «اثر بر فهم».
 * - impact: اثرِ معرفتیِ وزنی (برای رتبه‌بندی)
 * - understoodCount: شمارِ «فهمم را بیشتر کرد» (برای نمایشِ آرام)
 */
export interface PublishedSummary {
  id: string;
  title: string;
  excerpt: string;
  turns: number;
  impact: number;
  understoodCount: number;
  publishedAt: string;
}

export const LIMITS = {
  /** حداکثر طول هر پیام کاربر (نویسه) */
  maxMessageChars: 4000,
  /** حداکثر تعداد نوبت پرسش‌وپاسخ در یک گفتگو */
  maxTurns: 40,
  /** حداکثر طول عنوان */
  maxTitleChars: 120,
} as const;

/** تعداد نوبت‌های گفتگو (هر نوبت: یک پیام جوینده + یک پاسخ مناد) */
export function turnCount(c: Pick<Conversation, 'messages'>): number {
  return c.messages.filter((m) => m.role === 'seeker').length;
}

/** عنوان گفتگو از نخستین پرسش ساخته می‌شود؛ قهرمان سایت حقیقت است، نه کاربر. */
export function deriveTitle(firstQuestion: string): string {
  const oneLine = firstQuestion.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= LIMITS.maxTitleChars) return oneLine;
  return oneLine.slice(0, LIMITS.maxTitleChars - 1).trimEnd() + '…';
}

export function excerptOf(c: Conversation, maxChars = 220): string {
  const firstMonad = c.messages.find((m) => m.role === 'monad');
  return excerptFromMessages(firstMonad ? [firstMonad] : [], maxChars);
}

/** گزیده از نخستین پاسخِ مناد در یک آرایه‌ی پیام (برای نسخه‌ی ترجمه‌شده هم). */
export function excerptFromMessages(
  messages: { role: MessageRole; content: string }[],
  maxChars = 220,
): string {
  const firstMonad = messages.find((m) => m.role === 'monad');
  const text = (firstMonad?.content ?? '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 1).trimEnd() + '…';
}
