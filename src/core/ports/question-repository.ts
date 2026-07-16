import type { Question, QuestionLink } from '../domain/question';

/**
 * پورتِ مخزنِ پرسش (ADR-0022، اصل ۵). پیاده‌سازی در فازهای بعد؛ این‌جا مرزِ آینده تعریف می‌شود.
 */
export interface QuestionRepository {
  create(question: Question): void;
  findById(id: string): Question | null;
  /** یافتنِ پرسشِ ریشه‌ایِ نزدیک بر پایهٔ مفاهیم/متن (خوشه‌بندیِ هم‌ریشه‌ها) */
  findByConcepts(conceptKeys: string[]): Question[];
  link(link: QuestionLink): void;
  listConversations(questionId: string): string[];
  incrementAsked(questionId: string, at: string): void;
}
