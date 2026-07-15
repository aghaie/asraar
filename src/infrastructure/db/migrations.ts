export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'init',
    sql: `
      CREATE TABLE conversations (
        id TEXT PRIMARY KEY,
        owner_token TEXT NOT NULL,
        title TEXT,
        status TEXT NOT NULL CHECK (status IN ('active', 'published', 'private')),
        value_up INTEGER NOT NULL DEFAULT 0,
        value_down INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        published_at TEXT
      );

      CREATE TABLE messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        seq INTEGER NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('seeker', 'monad')),
        content TEXT NOT NULL,
        original_content TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX idx_messages_conversation ON messages(conversation_id, seq);

      CREATE TABLE value_signals (
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        voter_key TEXT NOT NULL,
        valuable INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (conversation_id, voter_key)
      );

      CREATE TABLE rate_events (
        key TEXT NOT NULL,
        day TEXT NOT NULL,
        action TEXT NOT NULL,
        count INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (key, day, action)
      );

      CREATE INDEX idx_conversations_published
        ON conversations(status, published_at DESC);
    `,
  },
  {
    version: 2,
    name: 'translations',
    sql: `
      CREATE TABLE translations (
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        lang TEXT NOT NULL,
        title TEXT NOT NULL,
        content_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (conversation_id, lang)
      );
    `,
  },
  {
    version: 3,
    name: 'search_index',
    sql: `
      CREATE VIRTUAL TABLE search_index USING fts5(
        conversation_id UNINDEXED,
        title,
        body,
        tokenize = 'unicode61 remove_diacritics 2'
      );
    `,
  },
];
