import type { DatabaseSync } from 'node:sqlite';
import type { TranslatedConversation, TranslationStore } from '@/core/ports/translator';

export class SqliteTranslationStore implements TranslationStore {
  constructor(private readonly db: DatabaseSync) {}

  find(conversationId: string, lang: string): TranslatedConversation | null {
    const row = this.db
      .prepare(
        'SELECT title, content_json FROM translations WHERE conversation_id = ? AND lang = ?',
      )
      .get(conversationId, lang) as { title: string; content_json: string } | undefined;
    if (!row) return null;
    return {
      lang,
      title: row.title,
      messages: JSON.parse(row.content_json) as TranslatedConversation['messages'],
    };
  }

  save(conversationId: string, translation: TranslatedConversation, at: string): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO translations (conversation_id, lang, title, content_json, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        conversationId,
        translation.lang,
        translation.title,
        JSON.stringify(translation.messages),
        at,
      );
  }
}
