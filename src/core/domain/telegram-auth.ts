/**
 * اعتبارسنجیِ initDataِ مینی‌اپِ تلگرام — منطقِ خالص و قابل‌تست.
 *
 * تلگرام هنگام باز کردنِ مینی‌اپ یک رشته‌ی امضاشده (`initData`) به WebView می‌دهد.
 * صحتِ آن با HMAC-SHA256 و کلیدی مشتق از توکنِ بات بررسی می‌شود — یک عملیاتِ
 * رمزنگاریِ کاملاً آفلاین (بدون هیچ تماسی با `api.telegram.org`). به همین دلیل
 * مینی‌اپ حتی روی سروری در ایران هم بدونِ گلوگاهِ فیلترینگ کار می‌کند. (ADR-0027)
 *
 * برای اینکه Core به `node:crypto` وابسته نشود، تابعِ امضا (`sign`) از بیرون
 * تزریق می‌شود؛ اینجا فقط تجزیه، ساختِ data-check-string، مقایسه و تازگیِ زمان است.
 */

export interface TelegramUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  languageCode: string | null;
}

export interface TelegramVerifyResult {
  ok: boolean;
  user: TelegramUser | null;
  reason: string | null;
}

/** تجزیه‌ی رشته‌ی `initData` (query-string) به جفت‌های کلید/مقدارِ رمزگشایی‌شده. */
export function parseInitData(initData: string): Map<string, string> {
  const params = new Map<string, string>();
  for (const pair of initData.split('&')) {
    if (!pair) continue;
    const eq = pair.indexOf('=');
    if (eq < 0) continue;
    const key = decodeURIComponent(pair.slice(0, eq));
    const value = decodeURIComponent(pair.slice(eq + 1));
    params.set(key, value);
  }
  return params;
}

/** رشته‌ی بررسیِ داده: همه‌ی جفت‌ها جز `hash`، مرتب بر پایه‌ی کلید، با `\n` جدا. */
export function dataCheckString(params: Map<string, string>): string {
  return [...params.entries()]
    .filter(([k]) => k !== 'hash')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

function parseUser(raw: string | undefined): TelegramUser | null {
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as {
      id?: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    if (u.id == null) return null;
    return {
      id: String(u.id),
      firstName: u.first_name ?? null,
      lastName: u.last_name ?? null,
      username: u.username ?? null,
      languageCode: u.language_code ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * اعتبارسنجیِ کاملِ `initData`.
 * @param sign تابعِ HMAC-SHA256 با کلیدِ مشتق از توکنِ بات؛ خروجی هگز (تزریق‌شده).
 * @param nowSeconds اکنون بر حسب ثانیه‌ی یونیکس.
 * @param maxAgeSeconds بیشینه‌ی عمرِ مجازِ `auth_date` (پرهیز از بازپخشِ کهنه).
 */
export function verifyInitData(
  initData: string,
  sign: (dataCheckString: string) => string,
  nowSeconds: number,
  maxAgeSeconds: number,
): TelegramVerifyResult {
  if (!initData) return { ok: false, user: null, reason: 'EMPTY' };

  const params = parseInitData(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false, user: null, reason: 'NO_HASH' };

  const expected = sign(dataCheckString(params));
  if (!timingSafeEqualHex(expected, hash)) {
    return { ok: false, user: null, reason: 'BAD_HASH' };
  }

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate) || nowSeconds - authDate > maxAgeSeconds) {
    return { ok: false, user: null, reason: 'STALE' };
  }

  const user = parseUser(params.get('user'));
  if (!user) return { ok: false, user: null, reason: 'NO_USER' };

  return { ok: true, user, reason: null };
}

/** مقایسه‌ی هگزِ هم‌طول به‌صورتِ زمان‌ثابت (پرهیز از نشتِ زمانی هنگامِ مقایسه). */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
