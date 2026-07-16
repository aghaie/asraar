/**
 * موجودیتِ «Insight» — داراییِ اصلیِ مناد (ADR-0022، اصل ۶).
 *
 * خلاصه‌ای از فهمِ حاصل از یک یا چند گفتگو. گفتگوها به‌مرور به Insight تبدیل می‌شوند.
 * Insightها قابلِ جست‌وجو، ترجمه و ارجاع‌اند و گرهِ گرافِ فهم را می‌سازند (اصل ۷).
 */
export interface Insight {
  id: string;
  /** عنوانِ کوتاه */
  title: string;
  /** خلاصهٔ یک یا دو جمله‌ای */
  summary: string;
  /** مفاهیمِ کلیدی — اتصال به گرافِ مفاهیم */
  conceptKeys: string[];
  /** درجهٔ اطمینان (۰ تا ۱): مناد فروتن است؛ فهم قطعی نیست مگر متن قطعی باشد */
  confidence: number;
  /** گفتگوهای منشأ که این فهم از آن‌ها برخاسته */
  sourceConversationIds: string[];
  /** Insightهای مرتبط — یال‌های گرافِ فهم */
  relatedInsightIds: string[];
  createdAt: string;
  /** آخرین بازبینی — فهم اصلاح‌پذیر است و کهنه می‌شود */
  revisedAt: string;
}

export function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
