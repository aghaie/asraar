import type { DatabaseSync } from 'node:sqlite';
import type { RateAction, RateLimiter } from '@/core/ports/rate-limiter';

export interface RateLimits {
  conversation: number;
  message: number;
  translation: number;
  login: number;
}

/**
 * سهمیه‌ی روزانه به ازای هر کلید (هش ناشناس IP) در SQLite.
 * MVP تک‌پردازه است؛ در مقیاس افقی، این پورت با Redis پیاده‌سازی می‌شود. (ADR-0006)
 */
export class SqliteRateLimiter implements RateLimiter {
  constructor(
    private readonly db: DatabaseSync,
    private readonly limits: RateLimits,
    private readonly now: () => Date = () => new Date(),
  ) {}

  consume(key: string, action: RateAction): { allowed: boolean; remaining: number } {
    const day = this.now().toISOString().slice(0, 10);
    const limit = this.limits[action];

    const row = this.db
      .prepare('SELECT count FROM rate_events WHERE key = ? AND day = ? AND action = ?')
      .get(key, day, action) as { count: number } | undefined;
    const used = row?.count ?? 0;

    if (used >= limit) return { allowed: false, remaining: 0 };

    this.db
      .prepare(
        `INSERT INTO rate_events (key, day, action, count) VALUES (?, ?, ?, 1)
         ON CONFLICT (key, day, action) DO UPDATE SET count = count + 1`,
      )
      .run(key, day, action);

    return { allowed: true, remaining: limit - used - 1 };
  }
}
