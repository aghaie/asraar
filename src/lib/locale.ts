import { cookies, headers } from 'next/headers';
import { SUPPORTED_LANGS, RTL_LANGS } from '@/app/c/[id]/languages';
import { preferredLanguageFrom } from '@/lib/http';

/**
 * زبانِ کاربر — «کلِ سرویس به زبانِ هر کاربر» (ADR-0022).
 * ترتیبِ حل: (۱) کوکیِ monad_lang → (۲) Accept-Language مرورگر → (۳) fa.
 * (پیوند به users.language برای کاربرِ واردشده در گامِ بعد افزوده می‌شود.)
 */
export const LANG_COOKIE = 'monad_lang';
export const DEFAULT_LOCALE = 'fa';

export async function currentLocale(): Promise<string> {
  const store = await cookies();
  const fromCookie = store.get(LANG_COOKIE)?.value;
  if (fromCookie && SUPPORTED_LANGS.includes(fromCookie)) return fromCookie;

  const accept = (await headers()).get('accept-language');
  const fromBrowser = preferredLanguageFrom(accept, SUPPORTED_LANGS);
  return fromBrowser || DEFAULT_LOCALE;
}

export function isRtlLocale(locale: string): boolean {
  return RTL_LANGS.has(locale);
}
