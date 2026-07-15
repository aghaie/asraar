import crypto from 'node:crypto';
import type { ConversationRepository } from '@/core/ports/conversation-repository';
import type { EmailSender } from '@/core/ports/email-sender';
import type { IdentityRepository } from '@/core/ports/identity-repository';
import type { LlmEngine } from '@/core/ports/llm-engine';
import type { RateLimiter } from '@/core/ports/rate-limiter';
import type { TranslationStore, Translator } from '@/core/ports/translator';
import { googleConfigFromEnv, type GoogleConfig } from './auth/google-oauth';
import { openDatabase } from './db/database';
import { ConsoleEmailSender } from './email/console-email-sender';
import { SmtpEmailSender } from './email/smtp-email-sender';
import { AnthropicEngine } from './llm/anthropic-engine';
import { AnthropicTranslator, FakeTranslator } from './llm/anthropic-translator';
import { FakeEngine } from './llm/fake-engine';
import { OpenAiEngine, OpenAiTranslator } from './llm/openai-engine';
import { SqliteRateLimiter } from './rate-limit/sqlite-rate-limiter';
import { SqliteConversationRepository } from './repositories/sqlite-conversation-repository';
import { SqliteIdentityRepository } from './repositories/sqlite-identity-repository';
import { SqliteTranslationStore } from './translations/sqlite-translation-store';

/** ترکیب‌کننده‌ی وابستگی‌ها (Composition Root) — تنها جایی که پیاده‌سازی‌ها انتخاب می‌شوند. */
export interface Container {
  repo: ConversationRepository;
  identity: IdentityRepository;
  email: EmailSender;
  google: GoogleConfig | null;
  engine: LlmEngine;
  translator: Translator;
  translationStore: TranslationStore;
  rateLimiter: RateLimiter;
  newId: () => string;
  newToken: () => string;
  hash: (value: string) => string;
  now: () => Date;
  salt: string;
  appUrl: string;
}

function selectEmailSender(): EmailSender {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim();
  if (host && user && pass && from) {
    return new SmtpEmailSender({
      host,
      port: intFromEnv('SMTP_PORT', 587),
      user,
      pass,
      from,
    });
  }
  return new ConsoleEmailSender();
}

function intFromEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * انتخاب موتور: MONAD_ENGINE اگر صریح تنظیم شده باشد؛ وگرنه هر کلیدی که موجود است
 * (اولویت با Anthropic). بدون کلید → موتور آزمایشی.
 */
function selectEngine(): { engine: LlmEngine; translator: Translator } {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const forced = process.env.MONAD_ENGINE;

  const provider =
    forced === 'anthropic' || forced === 'openai' || forced === 'fake'
      ? forced
      : anthropicKey
        ? 'anthropic'
        : openaiKey
          ? 'openai'
          : 'fake';

  if (provider === 'anthropic' && anthropicKey) {
    const model = process.env.MONAD_MODEL ?? 'claude-sonnet-5';
    return {
      engine: new AnthropicEngine(anthropicKey, model),
      translator: new AnthropicTranslator(anthropicKey, model),
    };
  }
  if (provider === 'openai' && openaiKey) {
    const model = process.env.MONAD_MODEL ?? 'gpt-5';
    return {
      engine: new OpenAiEngine(openaiKey, model),
      translator: new OpenAiTranslator(openaiKey, model),
    };
  }
  return { engine: new FakeEngine(), translator: new FakeTranslator() };
}

function build(): Container {
  const db = openDatabase(process.env.MONAD_DB_PATH ?? './data/monad.db');

  const { engine, translator } = selectEngine();
  const email = selectEmailSender();
  const google = googleConfigFromEnv();

  console.log(
    JSON.stringify({
      level: 'info',
      msg: 'monad container built',
      engine: engine.name,
      email: email.name,
      google: google ? 'on' : 'off',
    }),
  );

  return {
    repo: new SqliteConversationRepository(db),
    identity: new SqliteIdentityRepository(db),
    email,
    google,
    engine,
    translator,
    translationStore: new SqliteTranslationStore(db),
    rateLimiter: new SqliteRateLimiter(db, {
      conversation: intFromEnv('MONAD_DAILY_CONVERSATIONS', 10),
      message: intFromEnv('MONAD_DAILY_MESSAGES', 200),
      translation: intFromEnv('MONAD_DAILY_TRANSLATIONS', 100),
      login: intFromEnv('MONAD_DAILY_LOGINS', 20),
    }),
    newId: () => crypto.randomUUID(),
    newToken: () => crypto.randomBytes(32).toString('base64url'),
    hash: (value: string) => crypto.createHash('sha256').update(value).digest('hex'),
    now: () => new Date(),
    salt: process.env.MONAD_SALT ?? 'monad-dev-salt',
    appUrl: (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  };
}

/** Singleton سازگار با HMR محیط توسعه‌ی Next */
export function getContainer(): Container {
  const g = globalThis as typeof globalThis & { __monadContainer?: Container };
  if (!g.__monadContainer) g.__monadContainer = build();
  return g.__monadContainer;
}
