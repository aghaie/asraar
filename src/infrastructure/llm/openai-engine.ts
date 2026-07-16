import type { EngineTurn, LlmEngine } from '@/core/ports/llm-engine';
import type { Translator } from '@/core/ports/translator';
import { MONAD_SYSTEM_PROMPT } from './monad-system-prompt';
import { openAiComplete, openAiCompleteStream } from './openai-client';
import {
  parseTranslatedArray,
  TRANSLATOR_SYSTEM_PROMPT,
} from './translator-system-prompt';

/** آداپتر OpenAI برای پورت LlmEngine — بدون SDK، فقط fetch. (ADR-0004) */
export class OpenAiEngine implements LlmEngine {
  readonly name = 'openai';

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    /** سقف شامل توکن‌های استدلال درونی مدل هم هست؛ پس سخاوتمندانه */
    private readonly maxTokens = 6000,
  ) {}

  async reply(history: EngineTurn[]): Promise<string> {
    return openAiComplete(this.request(history));
  }

  async replyStream(
    history: EngineTurn[],
    onDelta: (text: string) => void,
  ): Promise<string> {
    return openAiCompleteStream(this.request(history), onDelta);
  }

  private request(history: EngineTurn[]) {
    return {
      apiKey: this.apiKey,
      model: this.model,
      system: MONAD_SYSTEM_PROMPT,
      maxTokens: this.maxTokens,
      messages: history.map((turn) => ({
        role: turn.role === 'seeker' ? ('user' as const) : ('assistant' as const),
        content: turn.content,
      })),
    };
  }
}

/** مترجم مبتنی بر OpenAI برای پورت Translator */
export class OpenAiTranslator implements Translator {
  readonly name = 'openai-translator';

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async translate(texts: string[], targetLanguage: string): Promise<string[]> {
    const raw = await openAiComplete({
      apiKey: this.apiKey,
      model: this.model,
      system: TRANSLATOR_SYSTEM_PROMPT,
      // سرِ ریزِ سخاوتمند: مدل‌های استدلالی (gpt-5) ممکن است هزاران توکنِ reasoning
      // مصرف کنند؛ با سقفِ کم، خروجیِ JSON ناقص می‌ماند و parse می‌شکند.
      maxTokens: 24000,
      messages: [{ role: 'user', content: JSON.stringify({ targetLanguage, texts }) }],
    });
    return parseTranslatedArray(raw, texts.length);
  }
}
