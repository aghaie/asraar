import { redirect } from 'next/navigation';
import type { User } from '@/core/domain/user';
import { currentUser, currentUserServer } from './auth';

/**
 * تعیینِ ادمین با فهرستِ ایمیل در env (کاما-جدا): `MONAD_ADMIN_EMAILS`.
 * طبق «تأخیر در انتزاع» (ADR-0025) هنوز جدولِ نقش نداریم؛ در حدِّ یک مالک کافی است.
 * خالی‌بودنِ env یعنی هیچ ادمینی نیست (پیش‌فرضِ امن).
 */
function adminEmails(): Set<string> {
  return new Set(
    (process.env.MONAD_ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdmin(user: User | null): boolean {
  if (!user?.email) return false;
  return adminEmails().has(user.email.toLowerCase());
}

/** گاردِ Server Component: کاربرِ ادمین را برمی‌گرداند، وگرنه به خانه هدایت می‌کند. */
export async function requireAdmin(): Promise<User> {
  const user = await currentUserServer();
  if (!isAdmin(user)) redirect('/');
  return user as User;
}

/** گاردِ Route Handler: کاربرِ ادمین یا null (تماس‌گیرنده ۴۰۳ می‌دهد). */
export function adminFromRequest(request: Request): User | null {
  const user = currentUser(request);
  return isAdmin(user) ? user : null;
}
