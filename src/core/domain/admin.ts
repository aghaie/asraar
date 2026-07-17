/**
 * مدلِ دامنه‌ی نمای مدیریت (ADR-0026).
 * پنلِ مدیریت ابزارِ صیانت از کرامت و سلامتِ معرفتیِ سرویس است — نه سنجشِ محبوبیت.
 * هیچ سازوکارِ محرومیت/بلاکِ کاربر این‌جا وجود ندارد و ساخته نمی‌شود (ADR-0006).
 */

import type { ConversationStatus } from './conversation';

/** شمارگانِ کلیِ سرویس برای داشبورد. معیارها معرفتی‌اند، نه محبوبیتی. */
export interface AdminStats {
  conversations: {
    total: number;
    published: number;
    active: number;
    private: number;
  };
  users: number;
  /** شمارِ کلِ سیگنال‌های معرفتیِ ثبت‌شده (اثر بر فهم). */
  signals: number;
  /** شمارِ گفتگوهایی که شاخه‌ی گفتگوی دیگرند. */
  branches: number;
  /** گفتگوهای منتشرشده در ۷ روزِ اخیر (رشدِ اخیر). */
  publishedLast7Days: number;
}

/** یک ردیفِ گفتگو در فهرستِ نظارتِ محتوا. */
export interface AdminConversationRow {
  id: string;
  title: string | null;
  status: ConversationStatus;
  turns: number;
  userId: string | null;
  parentId: string | null;
  createdAt: string;
  publishedAt: string | null;
}
