import { notFound } from 'next/navigation';
import { detectTextLanguage } from '@/core/domain/detect-language';
import { getContainer } from '@/infrastructure/container';
import { currentLocale } from '@/lib/locale';
import { ConversationView } from './conversation-view';

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
  const branches = repo.listBranches(id);

  // زبانِ کاربر (کوکی → مرورگر → fa) و زبانِ اصلیِ گفتگو
  const readerLang = await currentLocale();
  const firstSeeker = conversation.messages.find((m) => m.role === 'seeker');
  const originalLang = detectTextLanguage(firstSeeker?.content ?? conversation.title ?? '');

  // فقط اگر زبانِ کاربر متفاوت است، ببینیم ترجمه‌ی کش‌شده هست یا نه (بدون مصرف سهمیه).
  const wantsOther = readerLang !== '' && readerLang !== originalLang;
  const cached = wantsOther ? translationStore.find(id, readerLang) : null;

  return (
    <ConversationView
      id={conversation.id}
      title={conversation.title ?? 'گفتگو'}
      publishedAt={conversation.publishedAt!}
      signalCounts={counts}
      branches={branches.map((b) => ({
        id: b.id,
        title: b.title,
        branchPoint: b.branchPoint,
        turns: b.turns,
      }))}
      parentId={conversation.parentId}
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
