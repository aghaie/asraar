import crypto from 'node:crypto';
import type { ConversationRepository } from '@/core/ports/conversation-repository';
import type { LlmEngine } from '@/core/ports/llm-engine';
import type { RateLimiter } from '@/core/ports/rate-limiter';
import type { TranslationStore, Translator } from '@/core/ports/translator';
import { openDatabase } from './db/database';
import { AnthropicEngine } from './llm/anthropic-engine';
import { AnthropicTranslator, FakeTranslator } from './llm/anthropic-translator';
import { FakeEngine } from './llm/fake-engine';
import { SqliteRateLimiter } from './rate-limit/sqlite-rate-limiter';
import { SqliteConversationRepository } from './repositories/sqlite-conversation-repository';
import { SqliteTranslationStore } from './translations/sqlite-translation-store';

/** ترکیب‌کننده‌ی وابستگی‌ها (Composition Root) — تنها جایی که پیاده‌سازی‌ها انتخاب می‌شوند. */
export interface Container {
  repo: ConversationRepository;
  engine: LlmEngine;
  translator: Translator;
  translationStore: TranslationStore;
  rateLimiter: RateLimiter;
  newId: () => string;
  newToken: () => string;
  now: () => Date;
  salt: string;
}

function intFromEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function build(): Container {
  const db = openDatabase(process.env.MONAD_DB_PATH ?? './data/monad.db');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.MONAD_MODEL ?? 'claude-sonnet-5';
  const engine: LlmEngine = apiKey ? new AnthropicEngine(apiKey, model) : new FakeEngine();
  const translator: Translator = apiKey
    ? new AnthropicTranslator(apiKey, model)
    : new FakeTranslator();

  console.log(
    JSON.stringify({ level: 'info', msg: 'monad container built', engine: engine.name }),
  );

  return {
    repo: new SqliteConversationRepository(db),
    engine,
    translator,
    translationStore: new SqliteTranslationStore(db),
    rateLimiter: new SqliteRateLimiter(db, {
      conversation: intFromEnv('MONAD_DAILY_CONVERSATIONS', 10),
      message: intFromEnv('MONAD_DAILY_MESSAGES', 200),
      translation: intFromEnv('MONAD_DAILY_TRANSLATIONS', 100),
    }),
    newId: () => crypto.randomUUID(),
    newToken: () => crypto.randomBytes(32).toString('base64url'),
    now: () => new Date(),
    salt: process.env.MONAD_SALT ?? 'monad-dev-salt',
  };
}

/** Singleton سازگار با HMR محیط توسعه‌ی Next */
export function getContainer(): Container {
  const g = globalThis as typeof globalThis & { __monadContainer?: Container };
  if (!g.__monadContainer) g.__monadContainer = build();
  return g.__monadContainer;
}
