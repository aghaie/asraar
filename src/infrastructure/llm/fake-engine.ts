import type { EngineTurn, LlmEngine } from '@/core/ports/llm-engine';

/**
 * موتور آزمایشی برای توسعه‌ی محلی بدون کلید API و برای تست‌ها.
 * پاسخ قطعی و قابل پیش‌بینی می‌دهد.
 */
export class FakeEngine implements LlmEngine {
  readonly name = 'fake';

  async reply(history: EngineTurn[]): Promise<string> {
    const last = history[history.length - 1]?.content ?? '';
    return [
      '(حالت آزمایشی — کلید موتور زبانی تنظیم نشده است)',
      '',
      `پرسش تو را شنیدم: «${last.slice(0, 200)}»`,
      '',
      'پیش از پاسخ، بگذار بپرسم: وقتی این پرسش را می‌پرسی، دقیقاً به دنبال چه چیزی هستی؟',
    ].join('\n');
  }
}
