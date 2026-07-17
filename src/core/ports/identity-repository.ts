import type { Session, User } from '../domain/user';

/** پورت مخزن هویت — پیاده‌سازی فعلی SQLite است. */
export interface IdentityRepository {
  findUserByEmail(email: string): User | null;
  findUserByGoogleSub(sub: string): User | null;
  findUserByTelegramId(telegramId: string): User | null;
  findUserById(id: string): User | null;
  createUser(user: User): void;
  updateDisplayName(userId: string, name: string): void;

  createSession(session: Session): void;
  findSession(token: string): Session | null;
  deleteSession(token: string): void;

  /** ثبت لینک جادویی؛ tokenHash هش SHA-256 توکن است (خودِ توکن ذخیره نمی‌شود). */
  createLoginToken(tokenHash: string, email: string, createdAt: string, expiresAt: string): void;
  /**
   * مصرف یک‌بارمصرفِ لینک جادویی: اگر معتبر و مصرف‌نشده و منقضی‌نشده باشد،
   * آن را مصرف‌شده علامت می‌زند و ایمیل را برمی‌گرداند؛ وگرنه null.
   */
  consumeLoginToken(tokenHash: string, nowIso: string): string | null;
}
