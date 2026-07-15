import { DomainError, notFound } from '../domain/errors';
import type { ConversationRepository } from '../ports/conversation-repository';
import type { RateLimiter } from '../ports/rate-limiter';
import type {
  TranslatedConversation,
  TranslationStore,
  Translator,
} from '../ports/translator';
import { isValidLanguageCode } from '../ports/translator';

export interface GetTranslatedConversationDeps {
  repo: ConversationRepository;
  translator: Translator;
  store: TranslationStore;
  rateLimiter: RateLimiter;
  now: () => Date;
}

/**
 * خواندن گفتگوی منتشرشده به زبان خواننده.
 * ترجمه‌ها کش می‌شوند تا هر گفتگو برای هر زبان فقط یک بار هزینه داشته باشد.
 */
export async function getTranslatedConversation(
  deps: GetTranslatedConversationDeps,
  conversationId: string,
  targetLanguage: string,
  clientKey: string,
): Promise<TranslatedConversation> {
  if (!isValidLanguageCode(targetLanguage)) {
    throw new DomainError('VALIDATION', 'کد زبان نامعتبر است.');
  }

  const conversation = deps.repo.findById(conversationId);
  if (!conversation || conversation.status !== 'published') throw notFound('گفتگو');

  const cached = deps.store.find(conversationId, targetLanguage);
  if (cached) return cached;

  const quota = deps.rateLimiter.consume(clientKey, 'translation');
  if (!quota.allowed) {
    throw new DomainError('RATE_LIMITED', 'سهمیه‌ی ترجمه‌ی امروز شما به پایان رسیده است.');
  }

  const texts = [
    conversation.title ?? '',
    ...conversation.messages.map((m) => m.content),
  ];

  let translated: string[];
  try {
    translated = await deps.translator.translate(texts, targetLanguage);
  } catch {
    throw new DomainError('ENGINE_FAILURE', 'ترجمه اکنون در دسترس نیست. بعداً تلاش کنید.');
  }
  if (translated.length !== texts.length) {
    throw new DomainError('ENGINE_FAILURE', 'ترجمه ناقص بازگشت. بعداً تلاش کنید.');
  }

  const result: TranslatedConversation = {
    lang: targetLanguage,
    title: translated[0],
    messages: conversation.messages.map((m, i) => ({
      role: m.role,
      content: translated[i + 1],
    })),
  };
  deps.store.save(conversationId, result, deps.now().toISOString());
  return result;
}
