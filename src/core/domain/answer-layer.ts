/**
 * لایه‌های پاسخِ مناد (ADR-0022، اصل ۴): پاسخ سه سطح دارد.
 *  - سطح اول (پاسخِ کوتاه) خودِ پیامِ مناد است و همیشه نمایش داده می‌شود.
 *  - سطح دوم و سوم تنبل و درخواستی‌اند و این‌جا مدل می‌شوند.
 */
export type AnswerLayer = 'reasoning' | 'quranic';

export const ANSWER_LAYERS: AnswerLayer[] = ['reasoning', 'quranic'];

export function isAnswerLayer(value: string): value is AnswerLayer {
  return (ANSWER_LAYERS as string[]).includes(value);
}
