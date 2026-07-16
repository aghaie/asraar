/**
 * موجودیتِ «پرسش» — مستقل از گفتگو (ADR-0022، اصل ۵).
 *
 * پرسش‌های هم‌ریشه به یک Question متصل می‌شوند تا بتوان دید یک پرسش چند بار و از چه
 * زاویه‌هایی مطرح شده و چه Insightهایی از آن حاصل شده است. Conversation فقط یکی از
 * تجلی‌های یک Question است.
 */
export interface Question {
  id: string;
  /** صورتِ متعارفِ پرسش (نمایندهٔ خوشهٔ هم‌ریشه‌ها) */
  canonicalText: string;
  /** مفاهیمِ کلیدیِ مرتبط — گرهِ اتصال به گرافِ مفاهیم (اصل ۷) */
  conceptKeys: string[];
  /** شمارِ دفعاتِ مطرح‌شدن (به‌مرور افزوده می‌شود) */
  askedCount: number;
  createdAt: string;
  updatedAt: string;
}

/** پیوندِ یک گفتگو به پرسشِ ریشه‌ایِ آن (چند-به-یک: هر پرسش، چند تجلی). */
export interface QuestionLink {
  questionId: string;
  conversationId: string;
  createdAt: string;
}
