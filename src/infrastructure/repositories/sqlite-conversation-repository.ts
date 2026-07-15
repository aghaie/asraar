import type { DatabaseSync } from 'node:sqlite';
import {
  excerptOf,
  type Conversation,
  type ConversationStatus,
  type Message,
  type PublishedSummary,
} from '@/core/domain/conversation';
import type { ConversationRepository } from '@/core/ports/conversation-repository';

interface ConversationRow {
  id: string;
  owner_token: string;
  title: string | null;
  status: ConversationStatus;
  value_up: number;
  value_down: number;
  created_at: string;
  published_at: string | null;
}

interface MessageRow {
  role: Message['role'];
  content: string;
  original_content: string | null;
  created_at: string;
}

export class SqliteConversationRepository implements ConversationRepository {
  constructor(private readonly db: DatabaseSync) {}

  create(c: Conversation): void {
    this.db
      .prepare(
        `INSERT INTO conversations (id, owner_token, title, status, value_up, value_down, created_at, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(c.id, c.ownerToken, c.title, c.status, c.valueUp, c.valueDown, c.createdAt, c.publishedAt);
  }

  findById(id: string): Conversation | null {
    const row = this.db
      .prepare('SELECT * FROM conversations WHERE id = ?')
      .get(id) as ConversationRow | undefined;
    if (!row) return null;

    const messages = (
      this.db
        .prepare(
          'SELECT role, content, original_content, created_at FROM messages WHERE conversation_id = ? ORDER BY seq',
        )
        .all(id) as unknown as MessageRow[]
    ).map((m) => ({
      role: m.role,
      content: m.content,
      originalContent: m.original_content,
      createdAt: m.created_at,
    }));

    return {
      id: row.id,
      ownerToken: row.owner_token,
      title: row.title,
      status: row.status,
      messages,
      valueUp: row.value_up,
      valueDown: row.value_down,
      createdAt: row.created_at,
      publishedAt: row.published_at,
    };
  }

  appendMessages(id: string, messages: Message[]): void {
    const nextSeqRow = this.db
      .prepare('SELECT COALESCE(MAX(seq), 0) AS max_seq FROM messages WHERE conversation_id = ?')
      .get(id) as { max_seq: number };
    let seq = nextSeqRow.max_seq;

    const insert = this.db.prepare(
      `INSERT INTO messages (conversation_id, seq, role, content, original_content, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );
    this.db.exec('BEGIN');
    try {
      for (const m of messages) {
        seq += 1;
        insert.run(id, seq, m.role, m.content, m.originalContent, m.createdAt);
      }
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  finish(
    id: string,
    status: Extract<ConversationStatus, 'published' | 'private'>,
    title: string | null,
    normalizedMessages: Message[] | null,
    publishedAt: string | null,
  ): void {
    this.db.exec('BEGIN');
    try {
      this.db
        .prepare('UPDATE conversations SET status = ?, title = ?, published_at = ? WHERE id = ?')
        .run(status, title, publishedAt, id);

      if (normalizedMessages) {
        this.db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id);
        const insert = this.db.prepare(
          `INSERT INTO messages (conversation_id, seq, role, content, original_content, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        );
        normalizedMessages.forEach((m, i) => {
          insert.run(id, i + 1, m.role, m.content, m.originalContent, m.createdAt);
        });
      }
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  listPublished(limit: number): PublishedSummary[] {
    const rows = this.db
      .prepare(
        `SELECT id, title, status, value_up, value_down, published_at,
                (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = conversations.id AND m.role = 'seeker') AS turns
         FROM conversations
         WHERE status = 'published'
         ORDER BY published_at DESC
         LIMIT ?`,
      )
      .all(limit) as unknown as (ConversationRow & { turns: number })[];

    return rows.map((row) => {
      const conversation = this.findById(row.id)!;
      return {
        id: row.id,
        title: row.title ?? 'گفتگو',
        excerpt: excerptOf(conversation),
        turns: row.turns,
        valueUp: row.value_up,
        valueDown: row.value_down,
        publishedAt: row.published_at!,
      };
    });
  }

  recordValueSignal(
    conversationId: string,
    voterKey: string,
    valuable: boolean,
    at: string,
  ): 'recorded' | 'duplicate' {
    const result = this.db
      .prepare(
        `INSERT OR IGNORE INTO value_signals (conversation_id, voter_key, valuable, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(conversationId, voterKey, valuable ? 1 : 0, at);

    if (Number(result.changes) === 0) return 'duplicate';

    const column = valuable ? 'value_up' : 'value_down';
    this.db
      .prepare(`UPDATE conversations SET ${column} = ${column} + 1 WHERE id = ?`)
      .run(conversationId);
    return 'recorded';
  }
}
