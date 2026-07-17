/** @type {import('next').NextConfig} */
const baseHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

// بقیه‌ی سایت: منعِ کاملِ قاب‌شدن (ضدِ clickjacking).
const securityHeaders = [...baseHeaders, { key: 'X-Frame-Options', value: 'DENY' }];

// مینی‌اپِ تلگرام (ADR-0027) باید داخلِ iframeِ کلاینت‌های وبِ تلگرام بار شود؛
// پس X-Frame-Options: DENY نمی‌گیرد و به‌جایش frame-ancestors فقط تلگرام را مجاز می‌کند.
const tmaHeaders = [
  ...baseHeaders,
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors https://web.telegram.org https://telegram.org 'self';",
  },
];

const nextConfig = {
  output: 'standalone',
  // برای راستی‌آزماییِ بیلد بدونِ آسیب به .next سرورِ dev: NEXT_DIST_DIR=.next-verify
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  async headers() {
    return [
      // همه‌جز مسیرهای /tma — با منعِ کاملِ قاب‌شدن.
      { source: '/((?!tma).*)', headers: securityHeaders },
      // مینی‌اپ و زیرمسیرهایش — مجازِ قاب‌شدن توسطِ تلگرام.
      { source: '/tma', headers: tmaHeaders },
      { source: '/tma/:path*', headers: tmaHeaders },
    ];
  },
};

export default nextConfig;
