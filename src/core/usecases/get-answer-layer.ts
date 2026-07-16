import { isAnswerLayer, type AnswerLayer } from '../domain/answer-layer';
import { detectTextLanguage } from '../domain/detect-language';
import { DomainError, notFound } from '../domain/errors';
import type { AnswerLayerBuilder, AnswerLayerStore, LayerTurn } from '../ports/answer-layer';
import type { ConversationRepository } from '../ports/conversation-repository';
import type { RateLimiter } from '../ports/rate-limiter';

export interface GetAnswerLayerDeps {
  repo: ConversationRepository;
  builder: AnswerLayerBuilder;
  store: AnswerLayerStore;
  rateLimiter: RateLimiter;
  now: () => Date;
}

/**
 * لایه‌ی درخواستیِ یک پاسخِ مناد (ADR-0022، اصل ۴): استدلال یا مبنای قرآنی.
 * تنبل و کش‌شونده؛ فقط نخستین درخواستِ هر (گفتگو، نوبت، لایه، زبان) سهمیه مصرف می‌کند.
 */
export async function getAnswerLayer(
  deps: GetAnswerLayerDeps,
  conversationId: string,
  seq: number,
  layer: string,
  clientKey: string,
): Promise<{ layer: AnswerLayer; content: string }> {
  if (!isAnswerLayer(layer)) {
    throw new DomainError('VALIDATION', 'لایه‌ی نامعتبر است.');
  }
  const conversation = deps.repo.findById(conversationId);
  if (!conversation || conversation.status !== 'published') throw notFound('گفتگو');

  // پیام‌ها بر پایه‌ی seq (۱-مبنا)؛ پیامِ هدف باید پاسخِ مناد باشد.
  const target = conversation.messages[seq - 1];
  if (!target || target.role !== 'monad') {
    throw new DomainError('VALIDATION', 'این نوبت پاسخِ مناد نیست.');
  }

  // زبانِ لایه = زبانِ خودِ پاسخ (R3 بعداً ترجمه‌ی لایه به زبانِ خواننده را می‌افزاید).
  const lang = detectTextLanguage(target.content);

  const cached = deps.store.find(conversationId, seq, layer, lang);
  if (cached) return { layer, content: cached };

  const quota = deps.rateLimiter.consume(clientKey, 'translation');
  if (!quota.allowed) {
    throw new DomainError('RATE_LIMITED', 'سهمیه‌ی امروز به پایان رسیده است. بعداً تلاش کن.');
  }

  const history: LayerTurn[] = conversation.messages
    .slice(0, seq)
    .map((m) => ({ role: m.role, content: m.content }));

  let content: string;
  try {
    content = await deps.builder.build(layer, history, target.content, lang);
  } catch {
    throw new DomainError('ENGINE_FAILURE', 'اکنون در دسترس نیست. بعداً تلاش کن.');
  }
  if (content.length === 0) {
    throw new DomainError('ENGINE_FAILURE', 'پاسخی دریافت نشد. بعداً تلاش کن.');
  }

  deps.store.save(conversationId, seq, layer, lang, content, deps.now().toISOString());
  return { layer, content };
}
