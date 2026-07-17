import type { Metadata } from 'next';
import { TmaApp } from './tma-app';

export const metadata: Metadata = {
  title: 'مناد در تلگرام',
  // مینی‌اپ داخلِ WebViewِ تلگرام باز می‌شود؛ نمایه‌سازیِ موتورِ جست‌وجو بی‌معناست.
  robots: { index: false, follow: false },
};

export default function TmaPage() {
  return <TmaApp />;
}
