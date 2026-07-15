/**
 * نرمال‌سازی نگارشی متن فارسی پیش از نمایش عمومی.
 *
 * اصل حاکم: «کوچک‌ترین تغییری در معنا مجاز نیست.»
 * بنابراین فقط تبدیل‌هایی انجام می‌شود که از نظر معنایی بی‌خطرند:
 *  - یکسان‌سازی نویسه‌های عربی/فارسی (ي→ی، ك→ک)
 *  - یکسان‌سازی ارقام عربی به فارسی
 *  - نیم‌فاصله برای «می / نمی» پیش از فعل
 *  - حذف فاصله‌ی اضافه قبل از علائم و افزودن فاصله بعد از آن‌ها
 *  - فشرده‌سازی فاصله‌ها و خط‌های خالی تکراری
 *
 * متن اصلی همیشه کنار نسخه‌ی نگارش‌شده نگه داشته می‌شود.
 */

const ARABIC_TO_PERSIAN: Record<string, string> = {
  'ي': 'ی',
  'ك': 'ک',
  '٠': '۰', '١': '۱', '٢': '۲', '٣': '۳', '٤': '۴',
  '٥': '۵', '٦': '۶', '٧': '۷', '٨': '۸', '٩': '۹',
};

const ZWNJ = '‌';

export function normalizePersian(input: string): string {
  let text = input;

  // یکسان‌سازی نویسه‌ها
  text = text.replace(/[يك٠-٩]/g, (ch) => ARABIC_TO_PERSIAN[ch] ?? ch);

  // نیم‌فاصله‌ی «می / نمی» پیش از فعل (فقط وقتی با فاصله‌ی کامل نوشته شده باشد)
  text = text.replace(/(^|[\s«("])((?:ن?می)) ([آ-یء])/g, `$1$2${ZWNJ}$3`);

  // حذف فاصله پیش از علائم نگارشی
  text = text.replace(/ +([،؛؟!.:)»])/g, '$1');

  // فاصله بعد از علائم نگارشی وقتی بلافاصله حرف آمده باشد
  text = text.replace(/([،؛؟!])([^\s،؛؟!.:)»\d])/g, '$1 $2');

  // فشرده‌سازی فاصله‌های افقی و خط‌های خالی تکراری
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

/**
 * خروجی برای ذخیره: اگر نرمال‌سازی چیزی را تغییر داده باشد،
 * نسخه‌ی اصلی هم برگردانده می‌شود تا قابل مشاهده بماند.
 */
export function normalizeForPublication(input: string): {
  content: string;
  originalContent: string | null;
} {
  const normalized = normalizePersian(input);
  return {
    content: normalized,
    originalContent: normalized === input.trim() ? null : input,
  };
}
