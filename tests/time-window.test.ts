import { describe, expect, it } from 'vitest';
import { isTimeWindow, windowRange } from '@/core/domain/time-window';

const NOW = new Date('2026-07-16T10:00:00');

describe('isTimeWindow', () => {
  it('مقادیر معتبر و نامعتبر را تشخیص می‌دهد', () => {
    expect(isTimeWindow('week')).toBe(true);
    expect(isTimeWindow('all')).toBe(true);
    expect(isTimeWindow('decade')).toBe(false);
  });
});

describe('windowRange', () => {
  it('«همه» بی‌مرز است', () => {
    expect(windowRange('all', NOW)).toEqual({ sinceIso: null, untilIso: null });
  });

  it('«امروز» از آغاز روز جاری شروع می‌شود', () => {
    const { sinceIso, untilIso } = windowRange('day', NOW);
    expect(new Date(sinceIso!).getTime()).toBe(
      new Date(2026, 6, 16, 0, 0, 0).getTime(),
    );
    expect(untilIso).toBeNull();
  });

  it('«دیروز» یک بازه‌ی تقویمیِ بسته است', () => {
    const { sinceIso, untilIso } = windowRange('yesterday', NOW);
    expect(new Date(sinceIso!).getTime()).toBe(new Date(2026, 6, 15, 0, 0, 0).getTime());
    expect(new Date(untilIso!).getTime()).toBe(new Date(2026, 6, 16, 0, 0, 0).getTime());
  });

  it('«این هفته» بازه‌ی چرخشی ۷ روزه است', () => {
    const { sinceIso } = windowRange('week', NOW);
    const diffDays = (NOW.getTime() - new Date(sinceIso!).getTime()) / 86_400_000;
    expect(diffDays).toBeCloseTo(7, 5);
  });
});
