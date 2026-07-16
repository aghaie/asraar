import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { detectTextLanguage } from '@/core/domain/detect-language';
import { getContainer } from '@/infrastructure/container';
import { preferredLanguageFrom } from '@/lib/http';
import { ConversationView } from './conversation-view';
import { SUPPORTED_LANGS } from './languages';

export const dynamic = 'force-dynamic';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { repo, translationStore } = getContainer();
  const conversation = repo.findById(id);

  if (!conversation || conversation.status !== 'published') notFound();

  const counts = repo.signalCounts(id);

  // زبان مرجّح خواننده و زبان اصلی گفتگو
  const acceptLang = (await headers()).get('accept-language');
  const readerLang = preferredLanguageFrom(acceptLang, SUPPORTED_LANGS);
  const firstSeeker = conversation.messages.find((m) => m.role === 'seeker');
  const originalLang = detectTextLanguage(firstSeeker?.content ?? conversation.title ?? '');

  // فقط اگر زبان خواننده متفاوت است، ببینیم ترجمه‌ی کش‌شده هست یا نه (بدون مصرف سهمیه).
  const wantsOther = readerLang !== '' && readerLang !== originalLang;
  const cached = wantsOther ? translationStore.find(id, readerLang) : null;

  return (
    <ConversationView
      id={conversation.id}
      title={conversation.title ?? 'گفتگو'}
      publishedAt={conversation.publishedAt!}
      signalCounts={counts}
      messages={conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        originalContent: m.originalContent,
      }))}
      preferredLang={wantsOther ? readerLang : null}
      initialTranslation={cached}
    />
  );
}
