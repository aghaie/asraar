import { AUTH, isValidEmail, sanitizeDisplayName, type Session, type User } from '@/core/domain/user';
import { DomainError } from '@/core/domain/errors';
import type { IdentityRepository } from '@/core/ports/identity-repository';
import type { EmailSender } from '@/core/ports/email-sender';
import type { RateLimiter } from '@/core/ports/rate-limiter';

export interface AuthDeps {
  identity: IdentityRepository;
  email: EmailSender;
  rateLimiter: RateLimiter;
  newId: () => string;
  /** توکن تصادفی خام (برای نشست و لینک جادویی) */
  newToken: () => string;
  /** هش SHA-256 هگز از یک رشته */
  hash: (value: string) => string;
  now: () => Date;
  appUrl: string;
}

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

/**
 * درخواست ورود با ایمیل: توکن یک‌بارمصرف می‌سازد، هشِ آن را ذخیره و لینک را ایمیل می‌کند.
 * برای جلوگیری از افشای وجود/عدم‌وجود حساب، همیشه بی‌صدا موفق می‌شود.
 */
export async function requestEmailLogin(
  deps: AuthDeps,
  rawEmail: string,
  clientKey: string,
): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  if (!isValidEmail(email)) {
    throw new DomainError('VALIDATION', 'نشانی ایمیل نامعتبر است.');
  }
  const quota = deps.rateLimiter.consume(clientKey, 'login');
  if (!quota.allowed) {
    throw new DomainError('RATE_LIMITED', 'درخواست‌های ورود امروز به پایان رسید. بعداً تلاش کنید.');
  }

  const token = deps.newToken();
  const now = deps.now();
  deps.identity.createLoginToken(
    deps.hash(token),
    email,
    now.toISOString(),
    new Date(now.getTime() + AUTH.loginTokenMinutes * MINUTE_MS).toISOString(),
  );

  const url = `${deps.appUrl}/api/auth/email/callback?token=${encodeURIComponent(token)}`;
  await deps.email.sendMagicLink(email, url);
}

function createSessionFor(deps: AuthDeps, user: User): string {
  const token = deps.newToken();
  const now = deps.now();
  const session: Session = {
    token,
    userId: user.id,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + AUTH.sessionDays * DAY_MS).toISOString(),
  };
  deps.identity.createSession(session);
  return token;
}

/**
 * ورودِ توسعه‌ای بدونِ لینکِ ایمیل: مستقیم برای یک ایمیل نشست می‌سازد.
 * فقط باید از مسیرِ فقط-توسعه صدا زده شود؛ هرگز در production. توکن نشست را برمی‌گرداند.
 */
export function devLoginAs(deps: AuthDeps, rawEmail: string): string {
  const email = rawEmail.trim().toLowerCase();
  let user = deps.identity.findUserByEmail(email);
  if (!user) {
    user = {
      id: deps.newId(),
      email,
      googleSub: null,
      displayName: null,
      createdAt: deps.now().toISOString(),
    };
    deps.identity.createUser(user);
  }
  return createSessionFor(deps, user);
}

/** تکمیل ورود ایمیلی: مصرف توکن، یافتن/ساختن کاربر، ساختن نشست. توکن نشست را برمی‌گرداند. */
export function completeEmailLogin(deps: AuthDeps, token: string): string {
  const email = deps.identity.consumeLoginToken(deps.hash(token), deps.now().toISOString());
  if (!email) {
    throw new DomainError('FORBIDDEN', 'این لینک نامعتبر یا منقضی شده است.');
  }

  let user = deps.identity.findUserByEmail(email);
  if (!user) {
    user = {
      id: deps.newId(),
      email,
      googleSub: null,
      displayName: null,
      createdAt: deps.now().toISOString(),
    };
    deps.identity.createUser(user);
  }
  return createSessionFor(deps, user);
}

/** تکمیل ورود گوگل: یافتن/ساختن کاربر بر پایه‌ی sub، ساختن نشست. */
export function completeGoogleLogin(
  deps: AuthDeps,
  profile: { sub: string; email: string | null; name: string | null },
): string {
  let user = deps.identity.findUserByGoogleSub(profile.sub);
  if (!user && profile.email) {
    // اگر قبلاً با همان ایمیل وارد شده، همان حساب را به گوگل هم پیوند می‌زنیم.
    const byEmail = deps.identity.findUserByEmail(profile.email.toLowerCase());
    if (byEmail) user = byEmail;
  }
  if (!user) {
    user = {
      id: deps.newId(),
      email: profile.email ? profile.email.toLowerCase() : null,
      googleSub: profile.sub,
      displayName: profile.name ? sanitizeDisplayName(profile.name) : null,
      createdAt: deps.now().toISOString(),
    };
    deps.identity.createUser(user);
  }
  return createSessionFor(deps, user);
}

/** کاربر یک نشست معتبر و منقضی‌نشده؛ وگرنه null (و در صورت انقضا، پاک‌سازی). */
export function userFromSession(deps: AuthDeps, token: string | undefined): User | null {
  if (!token) return null;
  const session = deps.identity.findSession(token);
  if (!session) return null;
  if (session.expiresAt < deps.now().toISOString()) {
    deps.identity.deleteSession(token);
    return null;
  }
  return deps.identity.findUserById(session.userId);
}

export function logout(deps: AuthDeps, token: string | undefined): void {
  if (token) deps.identity.deleteSession(token);
}

export function setDisplayName(deps: AuthDeps, userId: string, rawName: string): string {
  const name = sanitizeDisplayName(rawName);
  if (name.length === 0) {
    throw new DomainError('VALIDATION', 'نام نمی‌تواند خالی باشد.');
  }
  deps.identity.updateDisplayName(userId, name);
  return name;
}
