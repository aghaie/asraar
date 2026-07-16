import { describe, expect, it } from 'vitest';
import {
  epistemicImpact,
  isEpistemicSignalKind,
  SIGNAL_WEIGHT,
} from '@/core/domain/epistemic-signal';
import { clampConfidence } from '@/core/domain/insight';

describe('epistemic signals (ADR-0022، اصل ۳)', () => {
  it('نوع‌های معتبر و نامعتبر را تشخیص می‌دهد', () => {
    expect(isEpistemicSignalKind('created-branch')).toBe(true);
    expect(isEpistemicSignalKind('like')).toBe(false); // «محبوبیت» وجود ندارد
  });

  it('اثرِ عمیق‌تر (شاخه/مبنای ادامه) سنگین‌تر از واکنشِ زودگذر است', () => {
    expect(SIGNAL_WEIGHT['created-branch']).toBeGreaterThan(SIGNAL_WEIGHT['thought-more']);
    expect(SIGNAL_WEIGHT['based-continuation']).toBeGreaterThan(
      SIGNAL_WEIGHT['read-background'],
    );
  });

  it('مجموعِ وزنیِ اثر را درست حساب می‌کند', () => {
    const impact = epistemicImpact({
      'thought-more': 2,
      'created-branch': 1,
      'like': 99, // نادیده گرفته می‌شود
    });
    expect(impact).toBe(2 * 1 + 1 * 3);
  });

  it('نبودِ سیگنال یعنی اثرِ صفر (هیچ سیگنالِ منفی‌ای نیست)', () => {
    expect(epistemicImpact({})).toBe(0);
  });
});

describe('clampConfidence', () => {
  it('در بازهٔ ۰ تا ۱ می‌ماند', () => {
    expect(clampConfidence(1.4)).toBe(1);
    expect(clampConfidence(-0.2)).toBe(0);
    expect(clampConfidence(0.7)).toBe(0.7);
    expect(clampConfidence(Number.NaN)).toBe(0);
  });
});
