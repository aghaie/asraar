import crypto from 'node:crypto';

/**
 * پیکربندیِ ورودِ تلگرام (مینی‌اپ) — آداپترِ زیرساخت.
 * کلیدِ مخفی طبقِ مستندِ تلگرام: `secret = HMAC_SHA256(key="WebAppData", msg=botToken)`.
 * سپس امضای هر پیام: `HMAC_SHA256(key=secret, msg=dataCheckString)` به‌صورتِ هگز.
 */
export interface TelegramConfig {
  botToken: string;
  botUsername: string | null;
  /** امضاکننده‌ی تزریقی برای منطقِ خالصِ `verifyInitData`. */
  sign: (dataCheckString: string) => string;
}

/** اگر `TELEGRAM_BOT_TOKEN` تنظیم باشد پیکربندی می‌سازد؛ وگرنه null (ورودِ تلگرام خاموش). */
export function telegramConfigFromEnv(): TelegramConfig | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) return null;

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  return {
    botToken,
    botUsername: process.env.TELEGRAM_BOT_USERNAME?.trim() || null,
    sign: (dcs: string) => crypto.createHmac('sha256', secret).update(dcs).digest('hex'),
  };
}
