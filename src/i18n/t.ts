/**
 * لایه‌ی i18n مناد — «کلِ سرویس به زبانِ هر کاربر».
 *
 * کاتالوگِ مرجع فارسی (messages/fa.json) دستی نوشته می‌شود؛ بقیه‌ی زبان‌ها یک‌بار با
 * اسکریپت scripts/gen-i18n.mjs از fa ساخته و در messages/<lang>.json ذخیره و این‌جا
 * رجیستر می‌شوند. کلیدِ نبوده به fa برمی‌گردد (fallback).
 *
 * توجه معماری (ADR-0022): ترجمه ویژگیِ «واحدِ محتوا» است. این فایل فقط ترجمه‌ی
 * «رشته‌های رابط» (chrome) را می‌پوشاند؛ ترجمه‌ی محتوای پویا (Conversation/Insight/…)
 * از طریق TranslationStore و کلیدِ (contentType, id, lang) انجام می‌شود.
 */
import fa from './messages/fa.json';
import en from './messages/en.json';
import ar from './messages/ar.json';
import tr from './messages/tr.json';
import ur from './messages/ur.json';
import id from './messages/id.json';
import fr from './messages/fr.json';
import de from './messages/de.json';
import es from './messages/es.json';
import ru from './messages/ru.json';
import zh from './messages/zh.json';
import hi from './messages/hi.json';

export type MessageKey = keyof typeof fa;
export type Messages = Record<string, string>;

const DICTIONARIES: Record<string, Messages> = {
  fa,
  en,
  ar,
  tr,
  ur,
  id,
  fr,
  de,
  es,
  ru,
  zh,
  hi,
};

export function dictionaryFor(locale: string): Messages {
  return DICTIONARIES[locale] ?? fa;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in params ? String(params[k]) : `{${k}}`,
  );
}

/** ترجمه‌ی یک کلید در locale مشخص (با fallback به fa و سپس خودِ کلید). */
export function t(
  locale: string,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const dict = dictionaryFor(locale);
  const template = dict[key] ?? (fa as Messages)[key] ?? String(key);
  return interpolate(template, params);
}
