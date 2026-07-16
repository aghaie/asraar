import type { DatabaseSync } from 'node:sqlite';
import type { AnswerLayer } from '@/core/domain/answer-layer';
import type { AnswerLayerStore } from '@/core/ports/answer-layer';

export class SqliteAnswerLayerStore implements AnswerLayerStore {
  constructor(private readonly db: DatabaseSync) {}

  find(conversationId: string, seq: number, layer: AnswerLayer, lang: string): string | null {
    const row = this.db
      .prepare(
        `SELECT content FROM answer_layers
         WHERE conversation_id = ? AND seq = ? AND layer = ? AND lang = ?`,
      )
      .get(conversationId, seq, layer, lang) as { content: string } | undefined;
    return row?.content ?? null;
  }

  save(
    conversationId: string,
    seq: number,
    layer: AnswerLayer,
    lang: string,
    content: string,
    at: string,
  ): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO answer_layers (conversation_id, seq, layer, lang, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(conversationId, seq, layer, lang, content, at);
  }
}
