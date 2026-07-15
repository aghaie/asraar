import {
  excerptOf,
  type Conversation,
  type ConversationStatus,
  type Message,
  type PublishedSummary,
} from '@/core/domain/conversation';
import type { ConversationRepository } from '@/core/ports/conversation-repository';
import type { RateAction, RateLimiter } from '@/core/ports/rate-limiter';
import type { EngineTurn, LlmEngine } from '@/core/ports/llm-engine';
import type {
  TranslatedConversation,
  TranslationStore,
  Translator,
} from '@/core/ports/translator';

export class InMemoryConversationRepository implements ConversationRepository {
  private readonly store = new Map<string, Conversation>();

  create(c: Conversation): void {
    this.store.set(c.id, structuredClone(c));
  }

  findById(id: string): Conversation | null {
    const c = this.store.get(id);
    return c ? structuredClone(c) : null;
  }

  appendMessages(id: string, messages: Message[]): void {
    this.store.get(id)!.messages.push(...structuredClone(messages));
  }

  finish(
    id: string,
    status: Extract<ConversationStatus, 'published' | 'private'>,
    title: string | null,
    normalizedMessages: Message[] | null,
    publishedAt: string | null,
  ): void {
    const c = this.store.get(id)!;
    c.status = status;
    c.title = title;
    c.publishedAt = publishedAt;
    if (normalizedMessages) c.messages = structuredClone(normalizedMessages);
  }

  listPublished(limit: number): PublishedSummary[] {
    return [...this.store.values()]
      .filter((c) => c.status === 'published')
      .slice(0, limit)
      .map((c) => ({
        id: c.id,
        title: c.title ?? 'گفتگو',
        excerpt: excerptOf(c),
        turns: c.messages.filter((m) => m.role === 'seeker').length,
        valueUp: c.valueUp,
        valueDown: c.valueDown,
        publishedAt: c.publishedAt!,
      }));
  }

  private readonly signals = new Set<string>();

  recordValueSignal(
    conversationId: string,
    voterKey: string,
    valuable: boolean,
  ): 'recorded' | 'duplicate' {
    const key = `${conversationId}:${voterKey}`;
    if (this.signals.has(key)) return 'duplicate';
    this.signals.add(key);
    const c = this.store.get(conversationId)!;
    if (valuable) c.valueUp += 1;
    else c.valueDown += 1;
    return 'recorded';
  }
}

export class StubRateLimiter implements RateLimiter {
  used = new Map<string, number>();

  constructor(private readonly limits: Record<RateAction, number>) {}

  consume(key: string, action: RateAction): { allowed: boolean; remaining: number } {
    const mapKey = `${key}:${action}`;
    const used = this.used.get(mapKey) ?? 0;
    if (used >= this.limits[action]) return { allowed: false, remaining: 0 };
    this.used.set(mapKey, used + 1);
    return { allowed: true, remaining: this.limits[action] - used - 1 };
  }
}

export class StubEngine implements LlmEngine {
  readonly name = 'stub';
  calls: EngineTurn[][] = [];
  replyStream?: (
    history: EngineTurn[],
    onDelta: (text: string) => void,
  ) => Promise<string>;

  constructor(private readonly cannedReply = 'پاسخ آزمایشی مناد') {}

  async reply(history: EngineTurn[]): Promise<string> {
    this.calls.push(history);
    return this.cannedReply;
  }
}

export class StubTranslator implements Translator {
  readonly name = 'stub-translator';
  calls = 0;

  async translate(texts: string[], targetLanguage: string): Promise<string[]> {
    this.calls += 1;
    return texts.map((t) => `[${targetLanguage}] ${t}`);
  }
}

export class InMemoryTranslationStore implements TranslationStore {
  private readonly store = new Map<string, TranslatedConversation>();

  find(conversationId: string, lang: string): TranslatedConversation | null {
    return this.store.get(`${conversationId}:${lang}`) ?? null;
  }

  save(conversationId: string, translation: TranslatedConversation): void {
    this.store.set(`${conversationId}:${translation.lang}`, translation);
  }
}

let counter = 0;
export function testDeps() {
  counter = 0;
  return {
    repo: new InMemoryConversationRepository(),
    rateLimiter: new StubRateLimiter({ conversation: 2, message: 10, translation: 2 }),
    engine: new StubEngine(),
    translator: new StubTranslator(),
    store: new InMemoryTranslationStore(),
    newId: () => `id-${++counter}`,
    newToken: () => `token-${counter}`,
    now: () => new Date('2026-07-15T12:00:00Z'),
  };
}
