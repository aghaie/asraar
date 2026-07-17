/**
 * قالب‌بندیِ تاریخ بر پایه‌ی زبانِ کاربر:
 *  - فارسی → تقویمِ شمسی (fa-IR با تقویم persian)
 *  - سایر زبان‌ها → میلادی، با locale خودشان
 * همه‌جا از این helper استفاده شود تا رفتار یکنواخت بماند.
 */
export function formatDate(locale: string, iso: string): string {
  try {
    const opts: Intl.DateTimeFormatOptions =
      locale === 'fa'
        ? { dateStyle: 'medium', calendar: 'persian' }
        : { dateStyle: 'medium' };
    return new Intl.DateTimeFormat(locale, opts).format(new Date(iso));
  } catch {
    return new Date(iso).toISOString().slice(0, 10);
  }
}
