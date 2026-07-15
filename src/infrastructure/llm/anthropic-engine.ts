import type { EngineTurn, LlmEngine } from '@/core/ports/llm-engine';
import { anthropicComplete } from './anthropic-client';
import { MONAD_SYSTEM_PROMPT } from './monad-system-prompt';

/**
 * آداپتر Anthropic برای پورت LlmEngine.
 * عمداً بدون SDK و فقط با fetch — وابستگی کمتر، تعویض آسان‌تر. (ADR-0004)
 */
export class AnthropicEngine implements LlmEngine {
  readonly name = 'anthropic';

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly maxTokens = 1500,
  ) {}

  async reply(history: EngineTurn[]): Promise<string> {
    return anthropicComplete({
      apiKey: this.apiKey,
      model: this.model,
      system: MONAD_SYSTEM_PROMPT,
      maxTokens: this.maxTokens,
      messages: history.map((turn) => ({
        role: turn.role === 'seeker' ? 'user' : 'assistant',
        content: turn.content,
      })),
    });
  }
}
