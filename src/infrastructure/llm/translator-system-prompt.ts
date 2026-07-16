/** دستور مترجم — مشترک میان همه‌ی موتورها. امانت در معنا بر روانی مقدم است. */
export const TRANSLATOR_SYSTEM_PROMPT = `You are a faithful translator for MONAD, a dialogue engine for seeking truth.
Rules:
- Translate each text in the given JSON array into the target language.
- Preserve meaning EXACTLY. Never add, remove, soften, or embellish anything.
- Keep Quranic verse references (surah name and verse number) intact and use the standard rendering of the Quranic text in the target language when a verse is quoted.
- Reply with ONLY a JSON array of translated strings, same length and order as the input. No prose, no code fences.`;

/** پاسخ خام مدل را به آرایه‌ی ترجمه‌ها تبدیل و اعتبارسنجی می‌کند. */
export function parseTranslatedArray(raw: string, expectedLength: number): string[] {
  let jsonText = raw.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    // بردباری در برابر متنِ اضافه پیش/پس از آرایه: نخستین آرایه‌ی JSON را استخراج کن.
    const start = jsonText.indexOf('[');
    const end = jsonText.lastIndexOf(']');
    if (start === -1 || end <= start) {
      throw new Error(`translator returned non-JSON (len=${raw.length})`);
    }
    jsonText = jsonText.slice(start, end + 1);
    parsed = JSON.parse(jsonText);
  }
  if (!Array.isArray(parsed) || !parsed.every((t) => typeof t === 'string')) {
    throw new Error('translator returned a non-string array');
  }
  if (parsed.length !== expectedLength) {
    throw new Error(
      `translator length mismatch: got ${parsed.length}, expected ${expectedLength}`,
    );
  }
  return parsed as string[];
}
