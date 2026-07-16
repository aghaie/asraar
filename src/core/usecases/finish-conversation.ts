import { deriveTitle, type Message } from '../domain/conversation';
import { DomainError, forbidden, notFound } from '../domain/errors';
import { normalizeForPublication, normalizePersian } from '../domain/normalize';
import type { ContentModerator } from '../ports/content-moderator';
import type { ConversationRepository } from '../ports/conversation-repository';

export interface FinishConversationDeps {
  repo: ConversationRepository;
  contentModerator: ContentModerator;
  now: () => Date;
}

export interface FinishConversationInput {
  conversationId: string;
  ownerToken: string;
  /** true: انتشار برای همه‌ی جهان — false: خصوصی می‌ماند */
  publish: boolean;
}

/**
 * پایان گفتگو به انتخاب جوینده: انتشار یا خصوصی ماندن.
 * هنگام انتشار، متن‌ها نگارش‌شده و نسخه‌ی اصلیِ تغییر‌یافته‌ها حفظ می‌شود.
 * پیش از انتشار عمومی، نوشته‌ی جوینده از نظر کرامتِ فضای عمومی سنجیده می‌شود
 * (توهین/هرزگی/اسپم رد می‌شود؛ پرسشِ صادقانه — هرچند بی‌پرده — آزاد است).
 */
export async function finishConversation(
  deps: FinishConversationDeps,
  input: FinishConversationInput,
): Promise<{ status: 'published' | 'private' }> {
  const conversation = deps.repo.findById(input.conversationId);
  if (!conversation) throw notFound('گفتگو');
  if (conversation.ownerToken !== input.ownerToken) throw forbidden();
  if (conversation.status !== 'active') {
    throw new DomainError('CONVERSATION_CLOSED', 'این گفتگو قبلاً پایان یافته است.');
  }
  if (conversation.messages.length === 0) {
    throw new DomainError('VALIDATION', 'گفتگوی خالی را نمی‌توان پایان داد.');
  }
  // شاخه باید دستِ‌کم یک نوبتِ تازه فراتر از پیشوندِ به‌ارث‌رسیده داشته باشد (اصل ۲: ادامه‌ی فهم).
  if (
    input.publish &&
    conversation.branchPoint !== null &&
    conversation.messages.length <= conversation.branchPoint
  ) {
    throw new DomainError(
      'VALIDATION',
      'برای انتشار، این مسیر را دستِ‌کم با یک پرسش تازه ادامه بده.',
    );
  }

  if (!input.publish) {
    deps.repo.finish(conversation.id, 'private', null, null, null);
    return { status: 'private' };
  }

  // نگهبانِ کرامت: فقط نوشته‌ی جوینده سنجیده می‌شود، نه پاسخ مناد.
  const seekerText = conversation.messages
    .filter((m) => m.role === 'seeker')
    .map((m) => m.content)
    .join('\n');
  const verdict = await deps.contentModerator.moderate(seekerText);
  if (!verdict.allow) {
    throw new DomainError(
      'CONTENT_REJECTED',
      verdict.reason
        ? `این گفتگو برای انتشار عمومی مناسب نیست: ${verdict.reason} می‌توانی آن را خصوصی نگه داری.`
        : 'این گفتگو برای انتشار عمومی مناسب نیست. می‌توانی آن را خصوصی نگه داری.',
    );
  }

  const normalizedMessages: Message[] = conversation.messages.map((m) => {
    if (m.role === 'monad') {
      // پاسخ مناد فقط از نظر نویسه یکسان‌سازی می‌شود؛ متن اصلی لازم نیست.
      return { ...m, content: normalizePersian(m.content) };
    }
    const { content, originalContent } = normalizeForPublication(m.content);
    return { ...m, content, originalContent };
  });

  const firstQuestion = normalizedMessages.find((m) => m.role === 'seeker');
  const title = deriveTitle(firstQuestion?.content ?? 'گفتگو');

  deps.repo.finish(
    conversation.id,
    'published',
    title,
    normalizedMessages,
    deps.now().toISOString(),
  );
  return { status: 'published' };
}
