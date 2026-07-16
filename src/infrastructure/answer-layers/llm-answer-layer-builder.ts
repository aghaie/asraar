import type { AnswerLayer } from '@/core/domain/answer-layer';
import type { AnswerLayerBuilder, LayerTurn } from '@/core/ports/answer-layer';

const REASONING_PROMPT = `تو «مناد» هستی. در ادامه، تاریخچه‌ی یک گفتگو و آخرین پاسخِ خودت آمده است.
لایه‌ی «استدلال» را بنویس: با همان زبانِ پاسخ، کوتاه و فروتنانه توضیح بده که چگونه به این پاسخ رسیدی — مسیرِ اندیشه، بدونِ آنکه لزوماً آیه‌ای نقل کنی.
دو تا چهار جمله. بدونِ مقدمه و تعارف. فقط متنِ استدلال.`;

const QURANIC_PROMPT = `تو «مناد» هستی. در ادامه، تاریخچه‌ی یک گفتگو و آخرین پاسخِ خودت آمده است.
لایه‌ی «مبنای قرآنی» را بنویس: با همان زبانِ پاسخ، مفاهیم و آیاتِ قرآنیِ مرتبط با این پاسخ را با نشانی دقیق (نام سوره و شماره‌ی آیه) و امانت‌داری کامل بیاور.
تنها آنچه از متن برمی‌آید؛ اگر قرآن به این موضوع پاسخِ قطعی نمی‌دهد، همین را صریح بگو. بدونِ مقدمه. فقط متنِ مبنا.`;

function promptFor(layer: AnswerLayer): string {
  return layer === 'reasoning' ? REASONING_PROMPT : QURANIC_PROMPT;
}

/** سازنده‌ی لایه بر پایه‌ی موتور زبانی. */
export class LlmAnswerLayerBuilder implements AnswerLayerBuilder {
  constructor(
    readonly name: string,
    private readonly complete: (system: string, user: string) => Promise<string>,
  ) {}

  async build(
    layer: AnswerLayer,
    history: LayerTurn[],
    answer: string,
    _lang: string,
  ): Promise<string> {
    const transcript = history
      .map((t) => `${t.role === 'seeker' ? 'جوینده' : 'مناد'}: ${t.content}`)
      .join('\n\n');
    const user = `# تاریخچه‌ی گفتگو\n${transcript}\n\n# پاسخی که باید لایه‌اش را بسازی\n${answer}`;
    return (await this.complete(promptFor(layer), user)).trim();
  }
}

/** سازنده‌ی آزمایشی برای توسعه بدون کلید. */
export class FakeAnswerLayerBuilder implements AnswerLayerBuilder {
  readonly name = 'fake-layer-builder';
  async build(layer: AnswerLayer): Promise<string> {
    return layer === 'reasoning'
      ? '(حالت آزمایشی) استدلالِ نمونه: این پاسخ از مفهومی بنیادین در قرآن برخاسته است.'
      : '(حالت آزمایشی) مبنای قرآنیِ نمونه: مفاهیم مرتبط، در صورت وجود، این‌جا با نشانی دقیق می‌آیند.';
  }
}
