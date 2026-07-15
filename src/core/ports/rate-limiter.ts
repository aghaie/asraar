/** پورت محدودسازی مصرف — کلید معمولاً هش ناشناس IP است. */

export type RateAction = 'conversation' | 'message' | 'translation';

export interface RateLimiter {
  /**
   * یک واحد از سهمیه‌ی روزانه‌ی کلید را مصرف می‌کند.
   * اگر سهمیه تمام شده باشد allowed=false برمی‌گردد و چیزی مصرف نمی‌شود.
   */
  consume(key: string, action: RateAction): { allowed: boolean; remaining: number };
}
