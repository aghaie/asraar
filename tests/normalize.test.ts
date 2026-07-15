import { describe, expect, it } from 'vitest';
import { normalizeForPublication, normalizePersian } from '@/core/domain/normalize';

describe('normalizePersian', () => {
  it('نویسه‌های عربی را فارسی می‌کند', () => {
    expect(normalizePersian('علي و ملائكة')).toBe('علی و ملائکة');
  });

  it('ارقام عربی را فارسی می‌کند', () => {
    expect(normalizePersian('آیه ٢٥٥')).toBe('آیه ۲۵۵');
  });

  it('«می» و «نمی» را با نیم‌فاصله می‌نویسد', () => {
    expect(normalizePersian('او می رود و نمی داند')).toBe('او می‌رود و نمی‌داند');
  });

  it('در آغاز جمله هم «می» را اصلاح می‌کند', () => {
    expect(normalizePersian('می خواهم بدانم')).toBe('می‌خواهم بدانم');
  });

  it('فاصله‌ی پیش از علائم را حذف و پس از آن‌ها اضافه می‌کند', () => {
    expect(normalizePersian('سلام ، خوبی ؟بله')).toBe('سلام، خوبی؟ بله');
  });

  it('فاصله‌ها و خط‌های خالی تکراری را فشرده می‌کند', () => {
    expect(normalizePersian('الف    ب\n\n\n\nج')).toBe('الف ب\n\nج');
  });

  it('واژه‌ای که خودش «می» دارد را خراب نمی‌کند', () => {
    expect(normalizePersian('میدان و میهمان')).toBe('میدان و میهمان');
  });
});

describe('normalizeForPublication', () => {
  it('وقتی متن تغییر می‌کند، نسخه‌ی اصلی را نگه می‌دارد', () => {
    const result = normalizeForPublication('من می روم');
    expect(result.content).toBe('من می‌روم');
    expect(result.originalContent).toBe('من می روم');
  });

  it('وقتی متن از قبل درست است، نسخه‌ی اصلی null است', () => {
    const result = normalizeForPublication('من می‌روم');
    expect(result.content).toBe('من می‌روم');
    expect(result.originalContent).toBeNull();
  });
});
