import type { DatabaseSync } from 'node:sqlite';
import {
  excerptOf,
  type BranchSummary,
  type Conversation,
  type ConversationStatus,
  type Message,
  type PublishedSummary,
} from '@/core/domain/conversation';
import {
  epistemicImpact,
  isEpistemicSignalKind,
  type EpistemicSignalKind,
  type SignalCounts,
} from '@/core/domain/epistemic-signal';
import type { ConversationRepository } from '@/core/ports/conversation-repository';
import type { OwnedConversationSummary } from '@/core/domain/user';

interface ConversationRow {
  id: string;
  owner_token: string;
  user_id: string | null;
  parent_id: string | null;
  branch_point: number | null;
  title: string | null;
  status: ConversationStatus;
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
    // ستون‌های value_up/value_down (محبوبیت) دیگر استفاده نمی‌شوند (ADR-0022)؛
    // با پیش‌فرضِ DB صفر می‌مانند و در دامنه حضور ندارند.
    this.db
      .prepare(
        `INSERT INTO conversations (id, owner_token, user_id, parent_id, branch_point, title, status, created_at, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        c.id,
        c.ownerToken,
        c.userId,
        c.parentId,
        c.branchPoint,
        c.title,
        c.status,
        c.createdAt,
        c.publishedAt,
      );
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
      userId: row.user_id,
      parentId: row.parent_id,
      branchPoint: row.branch_point,
      title: row.title,
      status: row.status,
      messages,
      createdAt: row.created_at,
      publishedAt: row.published_at,
    };
  }

  listBranches(parentId: string): BranchSummary[] {
    const rows = this.db
      .prepare(
        `SELECT id, title, branch_point, published_at,
                (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = conversations.id AND m.role = 'seeker') AS turns
         FROM conversations
         WHERE parent_id = ? AND status = 'published'
         ORDER BY published_at DESC`,
      )
      .all(parentId) as unknown as (ConversationRow & { turns: number })[];

    return rows.map((row) => ({
      id: row.id,
      title: row.title ?? 'گفتگو',
      branchPoint: row.branch_point ?? 0,
      turns: row.turns,
      publishedAt: row.published_at!,
    }));
  }

  listByUser(userId: string): OwnedConversationSummary[] {
    const rows = this.db
      .prepare(
        `SELECT id, title, status, created_at, published_at,
                (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = conversations.id AND m.role = 'seeker') AS turns
         FROM conversations
         WHERE user_id = ?
         ORDER BY created_at DESC`,
      )
      .all(userId) as unknown as (ConversationRow & { turns: number })[];

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      turns: row.turns,
      createdAt: row.created_at,
      publishedAt: row.published_at,
    }));
  }

  claimConversation(conversationId: string, ownerToken: string, userId: string): boolean {
    const result = this.db
      .prepare(
        `UPDATE conversations SET user_id = ?
         WHERE id = ? AND owner_token = ? AND user_id IS NULL`,
      )
      .run(userId, conversationId, ownerToken);
    return Number(result.changes) > 0;
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

      // ایندکس جست‌وجو فقط برای گفتگوهای منتشرشده ساخته می‌شود.
      if (status === 'published' && normalizedMessages) {
        const body = normalizedMessages.map((m) => m.content).join('\n');
        this.db
          .prepare(
            'INSERT INTO search_index (conversation_id, title, body) VALUES (?, ?, ?)',
          )
          .run(id, title ?? '', body);
      }
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  listPublished(
    limit: number,
    sinceIso?: string | null,
    untilIso?: string | null,
  ): PublishedSummary[] {
    const clauses = ["status = 'published'"];
    const params: (string | number)[] = [];
    if (sinceIso) {
      clauses.push('published_at >= ?');
      params.push(sinceIso);
    }
    if (untilIso) {
      clauses.push('published_at < ?');
      params.push(untilIso);
    }
    params.push(limit);

    const rows = this.db
      .prepare(
        `SELECT id, title, status, value_up, value_down, published_at,
                (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = conversations.id AND m.role = 'seeker') AS turns
         FROM conversations
         WHERE ${clauses.join(' AND ')}
         ORDER BY published_at DESC
         LIMIT ?`,
      )
      .all(...params) as unknown as (ConversationRow & { turns: number })[];

    return rows.map((row) => this.summaryFromRow(row));
  }

  search(match: string, limit: number): PublishedSummary[] {
    if (match.length === 0) return [];
    const rows = this.db
      .prepare(
        `SELECT c.id, c.title, c.status, c.value_up, c.value_down, c.published_at,
                (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.role = 'seeker') AS turns
         FROM search_index s
         JOIN conversations c ON c.id = s.conversation_id
         WHERE search_index MATCH ? AND c.status = 'published'
         ORDER BY bm25(search_index)
         LIMIT ?`,
      )
      .all(match, limit) as unknown as (ConversationRow & { turns: number })[];

    return rows.map((row) => this.summaryFromRow(row));
  }

  private summaryFromRow(row: ConversationRow & { turns: number }): PublishedSummary {
    const conversation = this.findById(row.id)!;
    const counts = this.signalCounts(row.id);
    return {
      id: row.id,
      title: row.title ?? 'گفتگو',
      excerpt: excerptOf(conversation),
      turns: row.turns,
      impact: epistemicImpact(counts),
      understoodCount: counts['understood-more'] ?? 0,
      publishedAt: row.published_at!,
    };
  }

  signalCounts(conversationId: string): SignalCounts {
    const rows = this.db
      .prepare(
        `SELECT kind, COUNT(*) AS c FROM epistemic_signals
         WHERE content_type = 'conversation' AND content_id = ?
         GROUP BY kind`,
      )
      .all(conversationId) as unknown as { kind: string; c: number }[];
    const counts: SignalCounts = {};
    for (const r of rows) counts[r.kind] = r.c;
    return counts;
  }

  recordEpistemicSignal(
    conversationId: string,
    kind: EpistemicSignalKind,
    actorKey: string,
    at: string,
  ): 'recorded' | 'duplicate' {
    if (!isEpistemicSignalKind(kind)) return 'duplicate';
    const result = this.db
      .prepare(
        `INSERT OR IGNORE INTO epistemic_signals (content_type, content_id, kind, actor_key, created_at)
         VALUES ('conversation', ?, ?, ?, ?)`,
      )
      .run(conversationId, kind, actorKey, at);
    return Number(result.changes) === 0 ? 'duplicate' : 'recorded';
  }
}
