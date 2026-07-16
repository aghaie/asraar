/**
 * ورود با گوگل (OAuth 2.0) — بدون SDK.
 * تبادل code سمت سرور، سپس خواندن userinfo (بدون پیچیدگی تأیید JWT).
 * اگر اعتبارنامه تنظیم نشده باشد، پیکربندی null است و دکمه‌ی گوگل پنهان می‌ماند.
 */

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface GoogleProfile {
  sub: string;
  email: string | null;
  name: string | null;
}

export function googleConfigFromEnv(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

export function googleAuthUrl(config: GoogleConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(
  config: GoogleConfig,
  code: string,
): Promise<GoogleProfile> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!tokenRes.ok) {
    throw new Error(`google token ${tokenRes.status}`);
  }
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) throw new Error('google: no access_token');

  const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { authorization: `Bearer ${token.access_token}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!infoRes.ok) throw new Error(`google userinfo ${infoRes.status}`);

  const info = (await infoRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
  };
  if (!info.sub) throw new Error('google: no sub');

  // ایمیل فقط در صورت تأییدشدن توسط گوگل قابل اعتماد است. وگرنه null می‌شود تا
  // پیوند به حسابِ موجود با همان ایمیل رخ ندهد (جلوگیری از تصاحب حساب).
  const verified = info.email_verified === true || info.email_verified === 'true';
  const email = info.email && verified ? info.email : null;
  return { sub: info.sub, email, name: info.name ?? null };
}
