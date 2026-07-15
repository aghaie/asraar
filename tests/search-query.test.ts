import { describe, expect, it } from 'vitest';
import { toFtsMatch } from '@/core/domain/search-query';

describe('toFtsMatch', () => {
  it('هر توکن را با پیشوندمطابقت می‌سازد', () => {
    expect(toFtsMatch('حقیقت آزادی')).toBe('"حقیقت"* "آزادی"*');
  });

  it('نویسه‌های خاص FTS را حذف می‌کند (بدون خطای نحوی/تزریق)', () => {
    expect(toFtsMatch('حقیقت* OR (آزادی)')).toBe('"حقیقت"* "OR"* "آزادی"*');
  });

  it('ورودی خالی یا فقط علائم → رشته‌ی خالی', () => {
    expect(toFtsMatch('   ')).toBe('');
    expect(toFtsMatch('***')).toBe('');
  });
});
