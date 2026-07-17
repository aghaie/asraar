import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { dataCheckString, parseInitData, verifyInitData } from '@/core/domain/telegram-auth';

const BOT_TOKEN = '123456:TEST-telegram-bot-token';

/** امضاکننده‌ی واقعی (همان چیزی که telegram-oauth.ts می‌سازد). */
function makeSigner(botToken: string): (dcs: string) => string {
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  return (dcs) => crypto.createHmac('sha256', secret).update(dcs).digest('hex');
}

/** یک initDataِ معتبر می‌سازد (query-string با hashِ درست). */
function buildInitData(params: Record<string, string>): string {
  const map = new Map(Object.entries(params));
  const hash = makeSigner(BOT_TOKEN)(dataCheckString(map));
  const parts = [...map.entries()].map(
    ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
  );
  parts.push(`hash=${hash}`);
  return parts.join('&');
}

const NOW = 1_800_000_000; // ثانیه‌ی یونیکس دلخواه
const USER_JSON = JSON.stringify({ id: 42, first_name: 'علی', username: 'ali' });

describe('verifyInitData', () => {
  const sign = makeSigner(BOT_TOKEN);

  it('یک initDataِ معتبر و تازه را می‌پذیرد و کاربر را استخراج می‌کند', () => {
    const initData = buildInitData({ auth_date: String(NOW), user: USER_JSON });
    const result = verifyInitData(initData, sign, NOW + 10, 3600);
    expect(result.ok).toBe(true);
    expect(result.user?.id).toBe('42');
    expect(result.user?.firstName).toBe('علی');
    expect(result.user?.username).toBe('ali');
  });

  it('دست‌کاریِ داده (hashِ نامعتبر) را رد می‌کند', () => {
    const initData = buildInitData({ auth_date: String(NOW), user: USER_JSON });
    // یک فیلد را پس از امضا عوض می‌کنیم؛ hash دیگر نمی‌خواند.
    const tampered = initData.replace(encodeURIComponent(USER_JSON), encodeURIComponent(
      JSON.stringify({ id: 999, first_name: 'مهاجم' }),
    ));
    const result = verifyInitData(tampered, sign, NOW + 10, 3600);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('BAD_HASH');
  });

  it('امضای ساخته‌شده با توکنِ دیگر را رد می‌کند', () => {
    const initData = buildInitData({ auth_date: String(NOW), user: USER_JSON });
    const wrongSign = makeSigner('999:other-token');
    const result = verifyInitData(initData, wrongSign, NOW + 10, 3600);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('BAD_HASH');
  });

  it('initDataِ کهنه (auth_date قدیمی) را رد می‌کند', () => {
    const initData = buildInitData({ auth_date: String(NOW), user: USER_JSON });
    const result = verifyInitData(initData, sign, NOW + 4000, 3600);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('STALE');
  });

  it('نبودِ hash و رشته‌ی خالی را رد می‌کند', () => {
    expect(verifyInitData('', sign, NOW, 3600).reason).toBe('EMPTY');
    expect(verifyInitData('auth_date=1&user=%7B%7D', sign, NOW, 3600).reason).toBe('NO_HASH');
  });
});

describe('parseInitData / dataCheckString', () => {
  it('کلیدها را رمزگشایی و data-check-string را مرتب می‌سازد', () => {
    const params = parseInitData('b=2&a=1&hash=zzz');
    expect(params.get('a')).toBe('1');
    // hash از رشته‌ی بررسی حذف و بقیه مرتب می‌شوند.
    expect(dataCheckString(params)).toBe('a=1\nb=2');
  });
});
