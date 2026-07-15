/**
 * پورت ترجمه — «هر کس به زبان خودش با مناد سخن می‌گوید و به زبان خودش می‌خواند.»
 * ترجمه باید امانت‌دار باشد؛ کوچک‌ترین تغییر معنا مجاز نیست.
 */

export interface Translator {
  readonly name: string;
  /** آرایه‌ی متن‌ها را به زبان مقصد برمی‌گرداند؛ طول خروجی باید برابر ورودی باشد. */
  translate(texts: string[], targetLanguage: string): Promise<string[]>;
}

export interface TranslatedConversation {
  lang: string;
  title: string;
  messages: { role: 'seeker' | 'monad'; content: string }[];
}

/** کش ترجمه‌ها — هر گفتگو برای هر زبان فقط یک بار ترجمه می‌شود. */
export interface TranslationStore {
  find(conversationId: string, lang: string): TranslatedConversation | null;
  save(conversationId: string, translation: TranslatedConversation, at: string): void;
}

/** کد زبان ساده (ISO 639-1) با منطقه‌ی اختیاری */
export function isValidLanguageCode(lang: string): boolean {
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(lang);
}
