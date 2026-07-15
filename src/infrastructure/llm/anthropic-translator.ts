import type { Translator } from '@/core/ports/translator';
import { anthropicComplete } from './anthropic-client';
import {
  parseTranslatedArray,
  TRANSLATOR_SYSTEM_PROMPT,
} from './translator-system-prompt';

/** مترجم مبتنی بر Anthropic — امانت در معنا بر روانی مقدم است. */
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
    return parseTranslatedArray(raw, texts.length);
  }
}

/** مترجم آزمایشی برای توسعه بدون کلید API */
export class FakeTranslator implements Translator {
  readonly name = 'fake-translator';

  async translate(texts: string[], targetLanguage: string): Promise<string[]> {
    return texts.map((t) => `[${targetLanguage}] ${t}`);
  }
}
