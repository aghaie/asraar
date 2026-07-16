import { notFound, redirect } from 'next/navigation';
import { isTimeWindow } from '@/core/domain/time-window';
import { ValuableConversations } from '../_components/valuable-conversations';

export const dynamic = 'force-dynamic';

const LABELS: Record<string, string> = {
  day: 'امروز',
  yesterday: 'دیروز',
  week: 'این هفته',
  month: 'این ماه',
  year: 'امسال',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ window: string }>;
}) {
  const { window } = await params;
  return LABELS[window] ? { title: `گفتگوهای ارزشمند — ${LABELS[window]}` } : {};
}

/** مسیرِ تمیزِ بازه‌های زمانی: /day، /week، /month، … ( «همه» روی / است ). */
export default async function WindowPage({
  params,
}: {
  params: Promise<{ window: string }>;
}) {
  const { window } = await params;
  if (window === 'all') redirect('/');
  if (!isTimeWindow(window)) notFound();
  return <ValuableConversations window={window} />;
}
