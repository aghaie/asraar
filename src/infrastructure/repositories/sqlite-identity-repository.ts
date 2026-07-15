import type { DatabaseSync } from 'node:sqlite';
import type { Session, User } from '@/core/domain/user';
import type { IdentityRepository } from '@/core/ports/identity-repository';

interface UserRow {
  id: string;
  email: string | null;
  google_sub: string | null;
  display_name: string | null;
  created_at: string;
}

interface SessionRow {
  token: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}

export class SqliteIdentityRepository implements IdentityRepository {
  constructor(private readonly db: DatabaseSync) {}

  private mapUser(row: UserRow | undefined): User | null {
    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      googleSub: row.google_sub,
      displayName: row.display_name,
      createdAt: row.created_at,
    };
  }

  findUserByEmail(email: string): User | null {
    return this.mapUser(
      this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined,
    );
  }

  findUserByGoogleSub(sub: string): User | null {
    return this.mapUser(
      this.db.prepare('SELECT * FROM users WHERE google_sub = ?').get(sub) as UserRow | undefined,
    );
  }

  findUserById(id: string): User | null {
    return this.mapUser(
      this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined,
    );
  }

  createUser(user: User): void {
    this.db
      .prepare(
        `INSERT INTO users (id, email, google_sub, display_name, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(user.id, user.email, user.googleSub, user.displayName, user.createdAt);
  }

  updateDisplayName(userId: string, name: string): void {
    this.db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(name, userId);
  }

  createSession(session: Session): void {
    this.db
      .prepare(
        `INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
      )
      .run(session.token, session.userId, session.createdAt, session.expiresAt);
  }

  findSession(token: string): Session | null {
    const row = this.db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as
      | SessionRow
      | undefined;
    if (!row) return null;
    return {
      token: row.token,
      userId: row.user_id,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  }

  deleteSession(token: string): void {
    this.db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }

  createLoginToken(
    tokenHash: string,
    email: string,
    createdAt: string,
    expiresAt: string,
  ): void {
    this.db
      .prepare(
        `INSERT INTO login_tokens (token_hash, email, created_at, expires_at, used)
         VALUES (?, ?, ?, ?, 0)`,
      )
      .run(tokenHash, email, createdAt, expiresAt);
  }

  consumeLoginToken(tokenHash: string, nowIso: string): string | null {
    const row = this.db
      .prepare('SELECT email, expires_at, used FROM login_tokens WHERE token_hash = ?')
      .get(tokenHash) as { email: string; expires_at: string; used: number } | undefined;
    if (!row || row.used === 1 || row.expires_at < nowIso) return null;

    const result = this.db
      .prepare('UPDATE login_tokens SET used = 1 WHERE token_hash = ? AND used = 0')
      .run(tokenHash);
    if (Number(result.changes) === 0) return null; // مسابقه‌ی هم‌زمانی
    return row.email;
  }
}
