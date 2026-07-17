import { getContainer } from '@/infrastructure/container';
import type { MessageKey } from '@/i18n/t';

export type HealthLevel = 'ok' | 'warn' | 'info';

/** یک ردیفِ سلامتِ پیکربندی برای صفحه‌ی مدیریت. مقادیر بدونِ رازند. */
export interface HealthItem {
  labelKey: MessageKey;
  level: HealthLevel;
  /** مقدارِ خام و بی‌راز (نام موتور، شمار، نشانی) یا خالی اگر valueKey داده شود. */
  valueText?: string;
  /** کلیدِ i18n برای وضعیت‌های واژگانی (روشن/خاموش/…). */
  valueKey?: MessageKey;
}

const DEFAULT_SALTS = new Set(['monad-dev-salt', 'change-me-in-production', '']);

/**
 * سلامتِ پیکربندیِ نمونه‌ی زنده (ADR-0026) — برای اطمینان هنگام استقرار.
 * هیچ کلید/رازی نمایش داده نمی‌شود؛ فقط «تنظیم‌شده/نشده» و نامِ آداپتر.
 */
export function serviceHealth(): HealthItem[] {
  const c = getContainer();
  const isRealEngine = c.engine.name !== 'fake';
  const isSmtp = c.email.name === 'smtp';
  const giftSet = !!process.env.MONAD_GIFT_URL?.trim();
  const adminCount = (process.env.MONAD_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean).length;
  const saltSecure = !DEFAULT_SALTS.has(c.salt);

  return [
    {
      labelKey: 'health.engine',
      level: isRealEngine ? 'ok' : 'warn',
      valueText: c.engine.name,
    },
    {
      labelKey: 'health.email',
      level: isSmtp ? 'ok' : 'info',
      valueKey: isSmtp ? 'health.smtp' : 'health.console',
    },
    {
      labelKey: 'health.google',
      level: c.google ? 'ok' : 'info',
      valueKey: c.google ? 'health.on' : 'health.off',
    },
    {
      labelKey: 'health.gift',
      level: giftSet ? 'ok' : 'info',
      valueKey: giftSet ? 'health.set' : 'health.unset',
    },
    {
      labelKey: 'health.admins',
      level: adminCount > 0 ? 'ok' : 'warn',
      valueText: String(adminCount),
    },
    {
      labelKey: 'health.salt',
      level: saltSecure ? 'ok' : 'warn',
      valueKey: saltSecure ? 'health.secure' : 'health.default',
    },
    {
      labelKey: 'health.appUrl',
      level: 'info',
      valueText: c.appUrl,
    },
  ];
}
