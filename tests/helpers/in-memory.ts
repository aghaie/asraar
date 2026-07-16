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
import type { OwnedConversationSummary, Session, User } from '@/core/domain/user';
import type { IdentityRepository } from '@/core/ports/identity-repository';
import type { ContentModerator, ModerationResult } from '@/core/ports/content-moderator';
import {
  epistemicImpact,
  type EpistemicSignalKind,
  type SignalCounts,
} from '@/core/domain/epistemic-signal';

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

  listPublished(
    limit: number,
    sinceIso?: string | null,
    untilIso?: string | null,
  ): PublishedSummary[] {
    return [...this.store.values()]
      .filter((c) => c.status === 'published')
      .filter((c) => (sinceIso ? c.publishedAt! >= sinceIso : true))
      .filter((c) => (untilIso ? c.publishedAt! < untilIso : true))
      .sort((a, b) => (a.publishedAt! < b.publishedAt! ? 1 : -1))
      .slice(0, limit)
      .map((c) => this.summary(c));
  }

  search(match: string, limit: number): PublishedSummary[] {
    if (match.length === 0) return [];
    // شبیه‌سازی ساده‌ی FTS: توکن‌های "word"* را به زیررشته تبدیل می‌کند.
    const terms = (match.match(/"([^"]+)"/g) ?? []).map((t) => t.replace(/"/g, ''));
    return [...this.store.values()]
      .filter((c) => c.status === 'published')
      .filter((c) => {
        const hay = `${c.title ?? ''}\n${c.messages.map((m) => m.content).join('\n')}`;
        return terms.every((t) => hay.includes(t));
      })
      .slice(0, limit)
      .map((c) => this.summary(c));
  }

  private summary(c: Conversation): PublishedSummary {
    const counts = this.signalCounts(c.id);
    return {
      id: c.id,
      title: c.title ?? 'گفتگو',
      excerpt: excerptOf(c),
      turns: c.messages.filter((m) => m.role === 'seeker').length,
      impact: epistemicImpact(counts),
      understoodCount: counts['understood-more'] ?? 0,
      publishedAt: c.publishedAt!,
    };
  }

  private readonly signalRows = new Map<string, { id: string; kind: string }>();

  recordEpistemicSignal(
    conversationId: string,
    kind: EpistemicSignalKind,
    actorKey: string,
  ): 'recorded' | 'duplicate' {
    const key = `${conversationId}:${kind}:${actorKey}`;
    if (this.signalRows.has(key)) return 'duplicate';
    this.signalRows.set(key, { id: conversationId, kind });
    return 'recorded';
  }

  signalCounts(conversationId: string): SignalCounts {
    const counts: SignalCounts = {};
    for (const { id, kind } of this.signalRows.values()) {
      if (id === conversationId) counts[kind] = (counts[kind] ?? 0) + 1;
    }
    return counts;
  }

  listBranches(parentId: string) {
    return [...this.store.values()]
      .filter((c) => c.parentId === parentId && c.status === 'published')
      .sort((a, b) => (a.publishedAt! < b.publishedAt! ? 1 : -1))
      .map((c) => ({
        id: c.id,
        title: c.title ?? 'گفتگو',
        branchPoint: c.branchPoint ?? 0,
        turns: c.messages.filter((m) => m.role === 'seeker').length,
        publishedAt: c.publishedAt!,
      }));
  }

  listByUser(userId: string): OwnedConversationSummary[] {
    return [...this.store.values()]
      .filter((c) => c.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        turns: c.messages.filter((m) => m.role === 'seeker').length,
        createdAt: c.createdAt,
        publishedAt: c.publishedAt,
      }));
  }

  claimConversation(conversationId: string, ownerToken: string, userId: string): boolean {
    const c = this.store.get(conversationId);
    if (!c || c.ownerToken !== ownerToken || c.userId !== null) return false;
    c.userId = userId;
    return true;
  }
}

export class InMemoryIdentityRepository implements IdentityRepository {
  private readonly users = new Map<string, User>();
  private readonly sessions = new Map<string, Session>();
  private readonly loginTokens = new Map<
    string,
    { email: string; expiresAt: string; used: boolean }
  >();

  findUserByEmail(email: string): User | null {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }
  findUserByGoogleSub(sub: string): User | null {
    return [...this.users.values()].find((u) => u.googleSub === sub) ?? null;
  }
  findUserById(id: string): User | null {
    return this.users.get(id) ?? null;
  }
  createUser(user: User): void {
    this.users.set(user.id, { ...user });
  }
  updateDisplayName(userId: string, name: string): void {
    const u = this.users.get(userId);
    if (u) u.displayName = name;
  }
  createSession(session: Session): void {
    this.sessions.set(session.token, { ...session });
  }
  findSession(token: string): Session | null {
    return this.sessions.get(token) ?? null;
  }
  deleteSession(token: string): void {
    this.sessions.delete(token);
  }
  createLoginToken(tokenHash: string, email: string, _c: string, expiresAt: string): void {
    this.loginTokens.set(tokenHash, { email, expiresAt, used: false });
  }
  consumeLoginToken(tokenHash: string, nowIso: string): string | null {
    const t = this.loginTokens.get(tokenHash);
    if (!t || t.used || t.expiresAt < nowIso) return null;
    t.used = true;
    return t.email;
  }
}

export class StubContentModerator implements ContentModerator {
  readonly name = 'stub-moderator';
  constructor(private readonly verdict: ModerationResult = { allow: true, reason: null }) {}
  async moderate(): Promise<ModerationResult> {
    return this.verdict;
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
    identity: new InMemoryIdentityRepository(),
    contentModerator: new StubContentModerator(),
    rateLimiter: new StubRateLimiter({
      conversation: 2,
      message: 10,
      translation: 2,
      login: 5,
    }),
    engine: new StubEngine(),
    translator: new StubTranslator(),
    store: new InMemoryTranslationStore(),
    newId: () => `id-${++counter}`,
    newToken: () => `token-${counter}`,
    now: () => new Date('2026-07-15T12:00:00Z'),
  };
}
