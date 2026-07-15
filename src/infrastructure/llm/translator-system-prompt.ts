/** دستور مترجم — مشترک میان همه‌ی موتورها. امانت در معنا بر روانی مقدم است. */
export const TRANSLATOR_SYSTEM_PROMPT = `You are a faithful translator for MONAD, a dialogue engine for seeking truth.
Rules:
- Translate each text in the given JSON array into the target language.
- Preserve meaning EXACTLY. Never add, remove, soften, or embellish anything.
- Keep Quranic verse references (surah name and verse number) intact and use the standard rendering of the Quranic text in the target language when a verse is quoted.
- Reply with ONLY a JSON array of translated strings, same length and order as the input. No prose, no code fences.`;

/** پاسخ خام مدل را به آرایه‌ی ترجمه‌ها تبدیل و اعتبارسنجی می‌کند. */
export function parseTranslatedArray(raw: string, expectedLength: number): string[] {
  const jsonText = raw.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(jsonText) as unknown;
  if (
    !Array.isArray(parsed) ||
    parsed.length !== expectedLength ||
    !parsed.every((t) => typeof t === 'string')
  ) {
    throw new Error('translator returned malformed output');
  }
  return parsed;
}
