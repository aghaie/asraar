import { redirect } from 'next/navigation';
import { getMyConversations } from '@/core/usecases/auth/get-my-conversations';
import { getContainer } from '@/infrastructure/container';
import { currentUserServer } from '@/lib/auth';
import { ChatSession } from '../_components/chat-session';

export const dynamic = 'force-dynamic';

export default async function NewConversationPage() {
  // اگر کاربرِ واردشده گفتگوی نیمه‌تمامی دارد، اول تکلیفِ آن روشن شود
  // (ادامه، انتشار یا خصوصی) — نه اینکه گفتگوهای رهاشده روی هم جمع شوند.
  const user = await currentUserServer();
  if (user) {
    const pending = getMyConversations(getContainer().repo, user.id).find(
      (c) => c.status === 'active' && c.turns > 0,
    );
    if (pending) redirect(`/continue/${pending.id}`);
  }

  return <ChatSession titleKey="new.title" introKey="new.intro" />;
}
