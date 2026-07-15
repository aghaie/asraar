import { notFound } from 'next/navigation';
import { getContainer } from '@/infrastructure/container';
import { ConversationView } from './conversation-view';

export const dynamic = 'force-dynamic';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { repo } = getContainer();
  const conversation = repo.findById(id);

  if (!conversation || conversation.status !== 'published') notFound();

  return (
    <ConversationView
      id={conversation.id}
      title={conversation.title ?? 'گفتگو'}
      publishedAt={conversation.publishedAt!}
      valueUp={conversation.valueUp}
      valueDown={conversation.valueDown}
      messages={conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        originalContent: m.originalContent,
      }))}
    />
  );
}
