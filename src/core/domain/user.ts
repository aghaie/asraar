/**
 * هویت اختیاری در مناد.
 * ورود هرگز اجباری نیست؛ جریان ناشناس (owner_token) دست‌نخورده می‌ماند.
 * کاربر فقط برای نام، همگام‌سازی و «بایگانی خصوصی سوال‌ها» وارد می‌شود.
 */

export interface User {
  id: string;
  email: string | null;
  googleSub: string | null;
  /** شناسه‌ی عددیِ تلگرام (رشته) در صورت ورود از مینی‌اپ — وگرنه null. (ADR-0027) */
  telegramId: string | null;
  displayName: string | null;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

/** خلاصه‌ی یک گفتگو برای بایگانی خصوصی کاربر (منتشرشده یا خصوصی، با وضعیت). */
export interface OwnedConversationSummary {
  id: string;
  title: string | null;
  status: 'active' | 'published' | 'private';
  turns: number;
  createdAt: string;
  publishedAt: string | null;
}

export const AUTH = {
  /** عمر نشست (روز) */
  sessionDays: 60,
  /** عمر لینک جادویی (دقیقه) */
  loginTokenMinutes: 20,
  maxDisplayNameChars: 40,
} as const;

export function sanitizeDisplayName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, AUTH.maxDisplayNameChars);
}

/** اعتبارسنجی سبک ایمیل (فقط شکل ظاهری؛ تأیید واقعی با کلیک لینک است). */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
