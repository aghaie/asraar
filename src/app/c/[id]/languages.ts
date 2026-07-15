/**
 * فهرست زبان‌ها — ماژول ساده (بدون 'use client') تا هم صفحه‌ی سرور و هم
 * کامپوننت کلاینت بتوانند import کنند. (import ثابت از ماژول کلاینت به سرور
 * مقدار را به reference تبدیل می‌کند و می‌شکند.)
 */
export const LANGUAGES: { code: string; label: string }[] = [
  { code: '', label: 'زبان اصلی' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ur', label: 'اردو' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'fa', label: 'فارسی' },
];

/** کدهای زبانِ پشتیبانی‌شده برای تطبیق با Accept-Language (بدون «زبان اصلی») */
export const SUPPORTED_LANGS: string[] = LANGUAGES.filter((l) => l.code).map(
  (l) => l.code,
);

export function labelOf(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}

export const RTL_LANGS = new Set(['fa', 'ar', 'ur', '']);
