import type { Translator } from '@/core/ports/translator';
import { anthropicComplete } from './anthropic-client';

const TRANSLATOR_SYSTEM_PROMPT = `You are a faithful translator for MONAD, a dialogue engine for seeking truth.
Rules:
- Translate each text in the given JSON array into the target language.
- Preserve meaning EXACTLY. Never add, remove, soften, or embellish anything.
- Keep Quranic verse references (surah name and verse number) intact and use the standard rendering of the Quranic text in the target language when a verse is quoted.
- Reply with ONLY a JSON array of translated strings, same length and order as the input. No prose, no code fences.`;

/** مترجم مبتنی بر LLM — امانت در معنا بر روانی مقدم است. */
export class AnthropicTranslator implements Translator {
  readonly name = 'anthropic-translator';

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async translate(texts: string[], targetLanguage: string): Promise<string[]> {
    const raw = await anthropicComplete({
      apiKey: this.apiKey,
      model: this.model,
      system: TRANSLATOR_SYSTEM_PROMPT,
      maxTokens: 8000,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ targetLanguage, texts }),
        },
      ],
    });

    const jsonText = raw.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(jsonText) as unknown;
    if (
      !Array.isArray(parsed) ||
      parsed.length !== texts.length ||
      !parsed.every((t) => typeof t === 'string')
    ) {
      throw new Error('translator returned malformed output');
    }
    return parsed;
  }
}

/** مترجم آزمایشی برای توسعه بدون کلید API */
export class FakeTranslator implements Translator {
  readonly name = 'fake-translator';

  async translate(texts: string[], targetLanguage: string): Promise<string[]> {
    return texts.map((t) => `[${targetLanguage}] ${t}`);
  }
}
