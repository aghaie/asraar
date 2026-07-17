import crypto from 'node:crypto';
import type { AnswerLayerBuilder, AnswerLayerStore } from '@/core/ports/answer-layer';
import type { ContentModerator } from '@/core/ports/content-moderator';
import type { ConversationRepository } from '@/core/ports/conversation-repository';
import type { EmailSender } from '@/core/ports/email-sender';
import type { IdentityRepository } from '@/core/ports/identity-repository';
import type { LlmEngine } from '@/core/ports/llm-engine';
import type { RateLimiter } from '@/core/ports/rate-limiter';
import type { TranslationStore, Translator } from '@/core/ports/translator';
import { FakeAnswerLayerBuilder, LlmAnswerLayerBuilder } from './answer-layers/llm-answer-layer-builder';
import { SqliteAnswerLayerStore } from './answer-layers/sqlite-answer-layer-store';
import { googleConfigFromEnv, type GoogleConfig } from './auth/google-oauth';
import { telegramConfigFromEnv, type TelegramConfig } from './auth/telegram-oauth';
import { openDatabase } from './db/database';
import { ConsoleEmailSender } from './email/console-email-sender';
import { SmtpEmailSender } from './email/smtp-email-sender';
import { AnthropicEngine } from './llm/anthropic-engine';
import { AnthropicTranslator, FakeTranslator } from './llm/anthropic-translator';
import { anthropicComplete } from './llm/anthropic-client';
import { FakeEngine } from './llm/fake-engine';
import { OpenAiEngine, OpenAiTranslator } from './llm/openai-engine';
import { openAiComplete } from './llm/openai-client';
import { FakeContentModerator, LlmContentModerator } from './moderation/llm-content-moderator';
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
  telegram: TelegramConfig | null;
  engine: LlmEngine;
  translator: Translator;
  contentModerator: ContentModerator;
  answerLayerBuilder: AnswerLayerBuilder;
  answerLayerStore: AnswerLayerStore;
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
function selectEngine(): {
  engine: LlmEngine;
  translator: Translator;
  contentModerator: ContentModerator;
  answerLayerBuilder: AnswerLayerBuilder;
} {
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
      contentModerator: new LlmContentModerator('anthropic-moderator', (system, user) =>
        anthropicComplete({
          apiKey: anthropicKey,
          model,
          system,
          maxTokens: 200,
          messages: [{ role: 'user', content: user }],
        }),
      ),
      answerLayerBuilder: new LlmAnswerLayerBuilder('anthropic-layer', (system, user) =>
        anthropicComplete({
          apiKey: anthropicKey,
          model,
          system,
          maxTokens: 1200,
          messages: [{ role: 'user', content: user }],
        }),
      ),
    };
  }
  if (provider === 'openai' && openaiKey) {
    const model = process.env.MONAD_MODEL ?? 'gpt-5';
    return {
      engine: new OpenAiEngine(openaiKey, model),
      translator: new OpenAiTranslator(openaiKey, model),
      contentModerator: new LlmContentModerator('openai-moderator', (system, user) =>
        openAiComplete({
          apiKey: openaiKey,
          model,
          system,
          maxTokens: 2000,
          messages: [{ role: 'user', content: user }],
        }),
      ),
      answerLayerBuilder: new LlmAnswerLayerBuilder('openai-layer', (system, user) =>
        openAiComplete({
          apiKey: openaiKey,
          model,
          system,
          // سرِ ریزِ استدلالِ gpt-5؛ وگرنه لایه‌ی بلند قطع می‌شود.
          maxTokens: 12000,
          messages: [{ role: 'user', content: user }],
        }),
      ),
    };
  }
  return {
    engine: new FakeEngine(),
    translator: new FakeTranslator(),
    contentModerator: new FakeContentModerator(),
    answerLayerBuilder: new FakeAnswerLayerBuilder(),
  };
}

function build(): Container {
  const db = openDatabase(process.env.MONAD_DB_PATH ?? './data/monad.db');

  const { engine, translator, contentModerator, answerLayerBuilder } = selectEngine();
  const email = selectEmailSender();
  const google = googleConfigFromEnv();
  const telegram = telegramConfigFromEnv();

  console.log(
    JSON.stringify({
      level: 'info',
      msg: 'monad container built',
      engine: engine.name,
      email: email.name,
      google: google ? 'on' : 'off',
      telegram: telegram ? 'on' : 'off',
    }),
  );

  return {
    repo: new SqliteConversationRepository(db),
    identity: new SqliteIdentityRepository(db),
    email,
    google,
    telegram,
    engine,
    translator,
    contentModerator,
    answerLayerBuilder,
    answerLayerStore: new SqliteAnswerLayerStore(db),
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
