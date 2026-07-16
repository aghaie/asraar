/**
 * الگوریتم دیده‌شدن مناد — بازطراحی‌شده بر «اثر بر فهم» (ADR-0022، اصل ۳).
 *
 * محبوبیت هرگز سنجیده نمی‌شود. ورودی‌ها فقط:
 *  - impact: مجموعِ وزنیِ سیگنال‌های معرفتی (بیشتر فکر کردم، فهمم بیشتر شد، مبنای ادامه شد،
 *    شاخه ساختم، پس‌زمینه را خواندم، بعداً بازگشتم). هیچ سیگنالِ منفی‌ای نیست.
 *  - عمق گفتگو (لگاریتمی، تا پرحرفی بر پرمایگی نچربد).
 *  - تازگی (ضریبِ ملایم؛ حقیقت با زمان بی‌ارزش نمی‌شود).
 */

export interface Rankable {
  /** اثرِ معرفتیِ وزنی (epistemicImpact از روی شمارِ سیگنال‌ها) */
  impact: number;
  turns: number;
  publishedAt: string;
}

const RECENCY_HALF_LIFE_DAYS = 14;

export function score(item: Rankable, now: Date): number {
  const effect = Math.log1p(Math.max(0, item.impact));
  const depth = Math.log1p(Math.max(0, item.turns));
  const ageDays =
    Math.max(0, now.getTime() - new Date(item.publishedAt).getTime()) / 86_400_000;
  const recency = Math.exp((-Math.LN2 * ageDays) / RECENCY_HALF_LIFE_DAYS);
  return (1 + effect) * (1 + depth) * (0.6 + 0.4 * recency);
}

export function rank<T extends Rankable>(items: T[], now: Date): T[] {
  return [...items].sort((a, b) => score(b, now) - score(a, now));
}
