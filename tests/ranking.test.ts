import { describe, expect, it } from 'vitest';
import { rank, score, type Rankable } from '@/core/domain/ranking';

const NOW = new Date('2026-07-15T12:00:00Z');

function item(overrides: Partial<Rankable>): Rankable {
  return {
    valueUp: 0,
    valueDown: 0,
    turns: 5,
    publishedAt: '2026-07-10T12:00:00Z',
    ...overrides,
  };
}

describe('score', () => {
  it('گفتگوی ارزشمندتر بالاتر می‌ایستد', () => {
    const strong = item({ valueUp: 30, valueDown: 2 });
    const weak = item({ valueUp: 2, valueDown: 30 });
    expect(score(strong, NOW)).toBeGreaterThan(score(weak, NOW));
  });

  it('عمق گفتگو در رتبه اثر دارد', () => {
    const deep = item({ turns: 20 });
    const shallow = item({ turns: 1 });
    expect(score(deep, NOW)).toBeGreaterThan(score(shallow, NOW));
  });

  it('یک رأی مثبتِ تنها، بر سابقه‌ی قوی غلبه نمی‌کند (تخمین لاپلاس)', () => {
    const newcomer = item({ valueUp: 1, valueDown: 0 });
    const established = item({ valueUp: 90, valueDown: 10 });
    expect(score(established, NOW)).toBeGreaterThan(score(newcomer, NOW));
  });

  it('گذشت زمان گفتگوی حقیقی را بی‌ارزش نمی‌کند — افت ملایم است', () => {
    const fresh = item({ publishedAt: '2026-07-15T11:00:00Z' });
    const old = item({ publishedAt: '2025-07-15T11:00:00Z' });
    const ratio = score(old, NOW) / score(fresh, NOW);
    expect(ratio).toBeGreaterThan(0.55);
    expect(ratio).toBeLessThan(1);
  });
});

describe('rank', () => {
  it('ترتیب نزولی امتیاز را برمی‌گرداند و ورودی را تغییر نمی‌دهد', () => {
    const a = item({ valueUp: 50, turns: 15 });
    const b = item({ valueUp: 1, turns: 1 });
    const input = [b, a];
    const output = rank(input, NOW);
    expect(output[0]).toBe(a);
    expect(input[0]).toBe(b);
  });
});
