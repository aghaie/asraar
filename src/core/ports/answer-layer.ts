import type { AnswerLayer } from '../domain/answer-layer';

export interface LayerTurn {
  role: 'seeker' | 'monad';
  content: string;
}

/**
 * سازنده‌ی لایه‌ی پاسخ (ADR-0022، اصل ۴ و ۹): «Background Builder».
 * تاریخچه‌ی گفتگو تا آن پاسخ + خودِ پاسخ را می‌گیرد و لایه‌ی خواسته‌شده را می‌سازد.
 * منطق مستقل از موتور است؛ موتور فقط متن را تولید می‌کند.
 */
export interface AnswerLayerBuilder {
  readonly name: string;
  build(layer: AnswerLayer, history: LayerTurn[], answer: string, lang: string): Promise<string>;
}

/** کشِ لایه‌ها — کلیدِ (گفتگو، نوبت، لایه، زبان) (اصل ۸: ترجمه/محتوا واحدِ محتوایی است). */
export interface AnswerLayerStore {
  find(conversationId: string, seq: number, layer: AnswerLayer, lang: string): string | null;
  save(
    conversationId: string,
    seq: number,
    layer: AnswerLayer,
    lang: string,
    content: string,
    at: string,
  ): void;
}
