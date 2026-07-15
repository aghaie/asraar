import { cookies } from 'next/headers';
import type { User } from '@/core/domain/user';
import { AUTH } from '@/core/domain/user';
import { userFromSession, type AuthDeps } from '@/core/usecases/auth/auth-service';
import { getContainer, type Container } from '@/infrastructure/container';

export const SESSION_COOKIE = 'monad_session';
const OAUTH_STATE_COOKIE = 'monad_oauth_state';

/** ساخت AuthDeps از Container. */
export function authDeps(c: Container = getContainer()): AuthDeps {
  return {
    identity: c.identity,
    email: c.email,
    rateLimiter: c.rateLimiter,
    newId: c.newId,
    newToken: c.newToken,
    hash: c.hash,
    now: c.now,
    appUrl: c.appUrl,
  };
}

/** خواندن توکن نشست از کوکی درخواست. */
export function sessionTokenFrom(request: Request): string | undefined {
  return readCookie(request, SESSION_COOKIE);
}

/** کاربر واردشده از روی کوکی نشست (یا null). */
export function currentUser(request: Request): User | null {
  return userFromSession(authDeps(), sessionTokenFrom(request));
}

/** نسخه‌ی مخصوص Server Componentها (از cookies() به‌جای Request). */
export async function currentUserServer(): Promise<User | null> {
  const store = await cookies();
  return userFromSession(authDeps(), store.get(SESSION_COOKIE)?.value);
}

export function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

const isProd = process.env.NODE_ENV === 'production';

export function sessionCookie(token: string): string {
  const maxAge = AUTH.sessionDays * 86_400;
  return cookie(SESSION_COOKIE, token, maxAge);
}

export function clearSessionCookie(): string {
  return cookie(SESSION_COOKIE, '', 0);
}

export function oauthStateCookie(state: string): string {
  return cookie(OAUTH_STATE_COOKIE, state, 600);
}
export function clearOauthStateCookie(): string {
  return cookie(OAUTH_STATE_COOKIE, '', 0);
}
export { OAUTH_STATE_COOKIE };

function cookie(name: string, value: string, maxAge: number): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (isProd) parts.push('Secure');
  return parts.join('; ');
}
