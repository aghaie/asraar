import type { Metadata } from 'next';
import { TmaApp } from './tma-app';

export const metadata: Metadata = {
  title: 'مناد در تلگرام',
  // مینی‌اپ داخلِ WebViewِ تلگرام باز می‌شود؛ نمایه‌سازیِ موتورِ جست‌وجو بی‌معناست.
  robots: { index: false, follow: false },
};

export default async function TmaPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  // پیش‌نمایشِ فقط-توسعه (?preview=1): بدونِ تلگرام، با تمِ نمونه — در production هرگز.
  const { preview } = await searchParams;
  const devPreview = process.env.NODE_ENV !== 'production' && preview === '1';
  return <TmaApp devPreview={devPreview} />;
}
