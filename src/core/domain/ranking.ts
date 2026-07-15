/**
 * الگوریتم دیده‌شدن مناد.
 *
 * ورودی‌های مجاز: کیفیت (نسبت «ارزشمند بود»)، عمق گفتگو، تازگی.
 * ورودی‌های ممنوع: شهرت، فالوئر، پول، تبلیغ — چنین داده‌ای اصلاً در مدل وجود ندارد.
 *
 * - کیفیت با تخمین لاپلاس محاسبه می‌شود تا گفتگوی تازه با یک رأی، صدر را نگیرد.
 * - عمق لگاریتمی است تا گفتگوی طولانیِ کم‌مایه بر گفتگوی کوتاهِ پرمایه غلبه نکند.
 * - تازگی فقط ضریب ملایم است؛ حقیقت با گذشت زمان بی‌ارزش نمی‌شود.
 */

export interface Rankable {
  valueUp: number;
  valueDown: number;
  turns: number;
  publishedAt: string;
}

const RECENCY_HALF_LIFE_DAYS = 14;

export function score(item: Rankable, now: Date): number {
  const quality = (item.valueUp + 1) / (item.valueUp + item.valueDown + 2);
  const depth = Math.log1p(Math.max(0, item.turns));
  const ageDays =
    Math.max(0, now.getTime() - new Date(item.publishedAt).getTime()) / 86_400_000;
  const recency = Math.exp((-Math.LN2 * ageDays) / RECENCY_HALF_LIFE_DAYS);
  return quality * (1 + depth) * (0.6 + 0.4 * recency);
}

export function rank<T extends Rankable>(items: T[], now: Date): T[] {
  return [...items].sort((a, b) => score(b, now) - score(a, now));
}
