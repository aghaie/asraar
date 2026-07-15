import { DomainError, notFound } from '../domain/errors';
import type { ConversationRepository } from '../ports/conversation-repository';

export interface RecordValueSignalDeps {
  repo: ConversationRepository;
  now: () => Date;
}

/**
 * تنها تعامل دیگران با یک گفتگو:
 * «این گفتگو برایم ارزشمند بود» یا «نبود». هیچ چیز بیشتر.
 */
export function recordValueSignal(
  deps: RecordValueSignalDeps,
  conversationId: string,
  voterKey: string,
  valuable: boolean,
): void {
  const conversation = deps.repo.findById(conversationId);
  if (!conversation || conversation.status !== 'published') throw notFound('گفتگو');

  const result = deps.repo.recordValueSignal(
    conversationId,
    voterKey,
    valuable,
    deps.now().toISOString(),
  );
  if (result === 'duplicate') {
    throw new DomainError('DUPLICATE_SIGNAL', 'نظر شما پیش‌تر ثبت شده است.');
  }
}
