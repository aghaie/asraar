/**
 * بازه‌های زمانی صفحه‌ی اصلی: امروز، دیروز، این هفته، این ماه، امسال، همه.
 *
 * روز و دیروز مرزِ تقویمی دارند (بر پایه‌ی روزِ محلیِ سرور)؛ هفته/ماه/سال بازه‌ی
 * چرخشیِ ۷/۳۰/۳۶۵ روزه از «اکنون» هستند؛ «همه» بی‌مرز است.
 */
export type TimeWindow = 'day' | 'yesterday' | 'week' | 'month' | 'year' | 'all';

export const TIME_WINDOWS: TimeWindow[] = [
  'day',
  'yesterday',
  'week',
  'month',
  'year',
  'all',
];

export function isTimeWindow(value: string): value is TimeWindow {
  return (TIME_WINDOWS as string[]).includes(value);
}

const DAY_MS = 86_400_000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function windowRange(
  window: TimeWindow,
  now: Date,
): { sinceIso: string | null; untilIso: string | null } {
  switch (window) {
    case 'day': {
      const start = startOfDay(now);
      return { sinceIso: start.toISOString(), untilIso: null };
    }
    case 'yesterday': {
      const start = startOfDay(now);
      const prev = new Date(start.getTime() - DAY_MS);
      return { sinceIso: prev.toISOString(), untilIso: start.toISOString() };
    }
    case 'week':
      return { sinceIso: new Date(now.getTime() - 7 * DAY_MS).toISOString(), untilIso: null };
    case 'month':
      return { sinceIso: new Date(now.getTime() - 30 * DAY_MS).toISOString(), untilIso: null };
    case 'year':
      return { sinceIso: new Date(now.getTime() - 365 * DAY_MS).toISOString(), untilIso: null };
    case 'all':
      return { sinceIso: null, untilIso: null };
  }
}
