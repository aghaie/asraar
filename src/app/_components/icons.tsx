/**
 * آیکن‌های سبکِ مناد — SVG خالص (بدون 'use client')، قابل‌استفاده در سرور و کلاینت.
 * همه با stroke=currentColor و ۱۸px؛ مینیمال و آرام، بدون تزئینِ اضافه.
 */
type P = { size?: number };
const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const SendIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4Z" />
  </svg>
);

export const FlagIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 22V4M4 4h13l-2 4 2 4H4" />
  </svg>
);

export const GlobeShareIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
  </svg>
);

export const LockIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const ChatIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z" />
  </svg>
);

export const CheckIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const LogoutIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const MailIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

export const GiftIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7S10.5 3 8 3a2 2 0 0 0 0 4h4Zm0 0s1.5-4 4-4a2 2 0 0 1 0 4h-4Z" />
  </svg>
);

export const TranslateIcon = ({ size }: P) => (
  <svg {...base(size)}>
    <path d="M4 5h7M8 3v2c0 4-2 7-5 8M5 9c0 3 3 5 6 6M13 21l4-9 4 9M15.5 17h5" />
  </svg>
);
