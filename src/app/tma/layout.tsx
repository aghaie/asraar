import './tma.css';

export const dynamic = 'force-dynamic';

/**
 * چیدمانِ مینی‌اپِ تلگرام (ADR-0027).
 * Next.js فایلِ CSSِ این segment را فقط روی مسیرِ /tma بارگذاری می‌کند؛ پس
 * پنهان‌کردنِ هدر/فوترِ مناد و بازنگاریِ توکن‌ها به تمِ تلگرام فقط اینجا اثر دارد.
 */
export default function TmaLayout({ children }: { children: React.ReactNode }) {
  return <div className="tma-root">{children}</div>;
}
