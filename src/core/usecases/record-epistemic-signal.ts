import { DomainError, notFound } from '../domain/errors';
import { isEpistemicSignalKind, type EpistemicSignalKind } from '../domain/epistemic-signal';
import type { ConversationRepository } from '../ports/conversation-repository';

export interface RecordEpistemicSignalDeps {
  repo: ConversationRepository;
  now: () => Date;
}

/**
 * ثبت یک سیگنالِ معرفتی روی گفتگوی منتشرشده (ADR-0022، اصل ۳).
 * فقط «اثر بر فهم»؛ هیچ سیگنالِ منفی یا محبوبیتی نیست. هر کنشگر هر نوع را یک بار.
 */
export function recordEpistemicSignal(
  deps: RecordEpistemicSignalDeps,
  conversationId: string,
  actorKey: string,
  kind: string,
): void {
  if (!isEpistemicSignalKind(kind)) {
    throw new DomainError('VALIDATION', 'نوع سیگنال نامعتبر است.');
  }
  const conversation = deps.repo.findById(conversationId);
  if (!conversation || conversation.status !== 'published') throw notFound('گفتگو');

  const result = deps.repo.recordEpistemicSignal(
    conversationId,
    kind as EpistemicSignalKind,
    actorKey,
    deps.now().toISOString(),
  );
  if (result === 'duplicate') {
    throw new DomainError('DUPLICATE_SIGNAL', 'این نشانه را پیش‌تر ثبت کرده‌ای.');
  }
}
