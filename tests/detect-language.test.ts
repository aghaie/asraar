import { describe, expect, it } from 'vitest';
import { detectTextLanguage } from '@/core/domain/detect-language';
import { preferredLanguageFrom } from '@/lib/http';

describe('detectTextLanguage', () => {
  it('فارسی را از روی حروف مخصوص تشخیص می‌دهد', () => {
    expect(detectTextLanguage('چگونه می‌توان به حقیقت رسید؟')).toBe('fa');
  });

  it('انگلیسی را تشخیص می‌دهد', () => {
    expect(detectTextLanguage('What is truth?')).toBe('en');
  });

  it('در ابهام، پیش‌فرض فارسی است', () => {
    expect(detectTextLanguage('123 ؟')).toBe('fa');
  });
});

describe('preferredLanguageFrom', () => {
  const supported = ['en', 'ar', 'fa', 'tr'];

  it('اولین زبان پشتیبانی‌شده را برمی‌گرداند', () => {
    expect(preferredLanguageFrom('en-US,en;q=0.9,fa;q=0.8', supported)).toBe('en');
  });

  it('به q احترام می‌گذارد', () => {
    expect(preferredLanguageFrom('xx;q=1.0,fa;q=0.9', supported)).toBe('fa');
  });

  it('زبان ناپشتیبان → رشته‌ی خالی', () => {
    expect(preferredLanguageFrom('ja,ko', supported)).toBe('');
    expect(preferredLanguageFrom(null, supported)).toBe('');
  });
});
