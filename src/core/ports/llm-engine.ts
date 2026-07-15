/**
 * پورت موتور زبانی.
 * Core فقط این Interface را می‌شناسد؛ هر موتوری (Anthropic، محلی، آینده…)
 * با نوشتن یک آداپتر قابل جایگزینی است.
 */

export interface EngineTurn {
  role: 'seeker' | 'monad';
  content: string;
}

export interface LlmEngine {
  /** نام موتور برای لاگ و مشاهده‌پذیری */
  readonly name: string;
  /** تاریخچه‌ی گفتگو را می‌گیرد و پاسخ بعدی مناد را برمی‌گرداند. */
  reply(history: EngineTurn[]): Promise<string>;
  /**
   * نسخه‌ی جریانی (اختیاری): تکه‌های پاسخ را به‌محض تولید به onDelta می‌دهد
   * و در پایان، متن کامل را برمی‌گرداند. موتورهای بدون استریم، این را ندارند
   * و Use Case خودش به reply() برمی‌گردد.
   */
  replyStream?(history: EngineTurn[], onDelta: (text: string) => void): Promise<string>;
}
