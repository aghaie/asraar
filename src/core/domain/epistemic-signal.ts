/**
 * سیگنال‌های معرفتی — «فقط اثر بر فهم سنجیده می‌شود، نه محبوبیت» (ADR-0022، اصل ۳).
 *
 * هیچ‌کدام محبوبیت را اندازه نمی‌گیرند؛ هر یک نشانه‌ای از اثرِ گفتگو بر فهمِ انسان است.
 * «مخالفت/رأیِ منفی» وجود ندارد. سیگنالِ منفی‌ای در کار نیست؛ نبودِ سیگنال یعنی نبودِ اثر.
 */
export type EpistemicSignalKind =
  | 'thought-more' // باعث شد بیشتر فکر کنم
  | 'understood-more' // فهمم را بیشتر کرد
  | 'based-continuation' // مبنای ادامهٔ مسیرم شد
  | 'created-branch' // باعث شد شاخهٔ جدیدی بسازم
  | 'read-background' // متنِ پس‌زمینه را مطالعه کردم
  | 'returned-later'; // بعداً دوباره بازگشتم

export const EPISTEMIC_SIGNAL_KINDS: EpistemicSignalKind[] = [
  'thought-more',
  'understood-more',
  'based-continuation',
  'created-branch',
  'read-background',
  'returned-later',
];

export function isEpistemicSignalKind(value: string): value is EpistemicSignalKind {
  return (EPISTEMIC_SIGNAL_KINDS as string[]).includes(value);
}

/**
 * وزنِ اثرِ معرفتیِ هر نوع سیگنال. مبنا: اثری که «حرکت به سمتِ فهم» را نشان می‌دهد
 * سنگین‌تر است (ساختنِ شاخه و قراردادنِ گفتگو به‌عنوانِ مبنا، عمیق‌ترین اثرند؛
 * یک واکنشِ زودگذر سبک‌تر). این وزن‌ها بعداً با داده‌ی واقعی کالیبره می‌شوند.
 */
export const SIGNAL_WEIGHT: Record<EpistemicSignalKind, number> = {
  'thought-more': 1,
  'read-background': 1,
  'understood-more': 2,
  'returned-later': 2,
  'based-continuation': 3,
  'created-branch': 3,
};

export interface SignalCounts {
  // شمارِ هر نوع سیگنال برای یک واحدِ محتوا
  [kind: string]: number;
}

/** مجموعِ وزنیِ اثرِ معرفتی از روی شمارها. */
export function epistemicImpact(counts: SignalCounts): number {
  let sum = 0;
  for (const kind of EPISTEMIC_SIGNAL_KINDS) {
    sum += (counts[kind] ?? 0) * SIGNAL_WEIGHT[kind];
  }
  return sum;
}
