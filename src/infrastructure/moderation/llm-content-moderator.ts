import type {
  ContentModerator,
  ModerationResult,
} from '@/core/ports/content-moderator';

export const MODERATION_SYSTEM_PROMPT = `You are the publication gatekeeper for MONAD, a calm space for seeking truth grounded in the Quran. A user wants to PUBLISH their conversation so the whole world can read it. Judge ONLY the seeker's own words (given below).

BLOCK publication only when the seeker's text contains one of:
- gratuitous profanity or sexual vulgarity,
- insults, slurs, harassment, or hatred toward a person or group,
- threats or incitement to harm,
- obvious spam, advertising, or link farming.

ALLOW everything else, including: sincere questions that are blunt, painful, doubtful, angry, provocative, or sharply critical of religion, God, ideologies, or authority. Seeking truth is the purpose; doubt and hard questions are welcome. Never block mere disagreement, skepticism, grief, or difficult topics.

Reply with ONLY a JSON object, no prose, no code fences:
{"allow": true} or {"allow": false, "reason": "<very short Persian reason>"}`;

export function parseModeration(raw: string): ModerationResult {
  const jsonText = raw.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  const parsed = JSON.parse(jsonText) as { allow?: unknown; reason?: unknown };
  if (typeof parsed.allow !== 'boolean') throw new Error('moderation: bad shape');
  return {
    allow: parsed.allow,
    reason: typeof parsed.reason === 'string' && parsed.reason ? parsed.reason : null,
  };
}

/** نگهبان مبتنی بر LLM. در هر خطا/ابهام fail-open (اجازه) می‌دهد تا جست‌وجوی حقیقت بند نیاید. */
export class LlmContentModerator implements ContentModerator {
  constructor(
    readonly name: string,
    private readonly complete: (system: string, user: string) => Promise<string>,
  ) {}

  async moderate(seekerText: string): Promise<ModerationResult> {
    const text = seekerText.trim();
    if (text.length === 0) return { allow: true, reason: null };
    try {
      const raw = await this.complete(MODERATION_SYSTEM_PROMPT, text);
      return parseModeration(raw);
    } catch (error) {
      console.warn(
        JSON.stringify({
          level: 'warn',
          msg: 'moderation failed — allowing (fail-open)',
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      return { allow: true, reason: null };
    }
  }
}

/** نگهبان آزمایشی/بدون‌کلید: همه را اجازه می‌دهد (dev). */
export class FakeContentModerator implements ContentModerator {
  readonly name = 'fake-moderator';
  async moderate(): Promise<ModerationResult> {
    return { allow: true, reason: null };
  }
}
