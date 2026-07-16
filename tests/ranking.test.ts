import { describe, expect, it } from 'vitest';
import { rank, score, type Rankable } from '@/core/domain/ranking';

const NOW = new Date('2026-07-15T12:00:00Z');

function item(overrides: Partial<Rankable>): Rankable {
  return {
    impact: 0,
    turns: 5,
    publishedAt: '2026-07-10T12:00:00Z',
    ...overrides,
  };
}

describe('score (اثر بر فهم — ADR-0022)', () => {
  it('گفتگوی پراثرتر بر فهم، بالاتر می‌ایستد', () => {
    const strong = item({ impact: 30 });
    const weak = item({ impact: 1 });
    expect(score(strong, NOW)).toBeGreaterThan(score(weak, NOW));
  });

  it('عمق گفتگو در رتبه اثر دارد', () => {
    const deep = item({ turns: 20 });
    const shallow = item({ turns: 1 });
    expect(score(deep, NOW)).toBeGreaterThan(score(shallow, NOW));
  });

  it('گفتگوی بی‌اثر (impact صفر) هم امتیازِ پایه از عمق/تازگی دارد', () => {
    expect(score(item({ impact: 0 }), NOW)).toBeGreaterThan(0);
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
    const a = item({ impact: 50, turns: 15 });
    const b = item({ impact: 0, turns: 1 });
    const input = [b, a];
    const output = rank(input, NOW);
    expect(output[0]).toBe(a);
    expect(input[0]).toBe(b);
  });
});
