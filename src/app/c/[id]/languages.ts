/**
 * فهرست زبان‌ها — ماژول ساده (بدون 'use client') تا هم صفحه‌ی سرور و هم
 * کامپوننت کلاینت بتوانند import کنند.
 */
export const LANGUAGES: { code: string; label: string }[] = [
  { code: 'fa', label: 'فارسی' },
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ur', label: 'اردو' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'hi', label: 'हिन्दी' },
];

/** کدهای زبانِ پشتیبانی‌شده برای تطبیق با Accept-Language و ترجمه. */
export const SUPPORTED_LANGS: string[] = LANGUAGES.map((l) => l.code);

/**
 * زبان‌هایی که فعلاً در سوییچرِ هدر نمایش داده می‌شوند (بقیه مخفی، نه حذف‌شده).
 * ترتیب: فارسی اول. با اثباتِ آماده‌بودنِ کاتالوگِ سایر زبان‌ها، این فهرست گسترش می‌یابد.
 */
export const VISIBLE_LANGS: string[] = ['fa', 'ar', 'en'];

export function visibleLanguages(): { code: string; label: string }[] {
  return VISIBLE_LANGS.map(
    (code) => LANGUAGES.find((l) => l.code === code)!,
  ).filter(Boolean);
}

export function labelOf(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

export const RTL_LANGS = new Set(['fa', 'ar', 'ur']);
