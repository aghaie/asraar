/**
 * تشخیص زبانِ اصلیِ یک متن با هیوریستیک اسکریپت (بدون وابستگی بیرونی).
 *
 * برای گفتگوهای مناد کافی است تا بدانیم زبان خواننده با زبان اصلی یکی است یا نه.
 * دقتِ مطلق هدف نیست؛ در ابهام، پیش‌فرض «fa» است (بیشترِ محتوا فارسی است).
 */
export function detectTextLanguage(text: string): string {
  // حروف مخصوص فارسی که در عربی نیستند
  if (/[پچژگک‌]/.test(text) || /ی/.test(text)) return 'fa';
  // حروف عربی (فقط حروف، نه علائم نگارشی مانند ؟ ؛ ،)
  if (/[ء-ي]/.test(text)) return 'ar';
  // سیریلیک
  if (/[Ѐ-ӿ]/.test(text)) return 'ru';
  // CJK
  if (/[一-鿿]/.test(text)) return 'zh';
  // لاتین
  if (/[A-Za-z]/.test(text)) return 'en';
  return 'fa';
}
