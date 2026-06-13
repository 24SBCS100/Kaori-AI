import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// ── Database path ──
const DB_PATH = path.resolve(process.env.DATABASE_PATH || "./.data/app.db");

// ── Singleton connection ──
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure directory exists
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  // Apply schema
  const schemaPath = path.join(process.cwd(), "db", "schema.sql");
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, "utf-8");
    _db.exec(schema);
  }

  // Safe migrations
  try {
    _db.exec("ALTER TABLE conversations ADD COLUMN is_starred INTEGER NOT NULL DEFAULT 0;");
  } catch (e: any) {
    // Ignore if column already exists
    if (!e.message.includes("duplicate column name")) {
      console.error("Migration error:", e);
    }
  }

  try {
    _db.exec("ALTER TABLE users ADD COLUMN is_pro INTEGER NOT NULL DEFAULT 0;");
  } catch (e: any) {
    if (!e.message.includes("duplicate column name")) {
      console.error("Migration error:", e);
    }
  }

  return _db;
}

// ══════════════════════════════════════════
// USER HELPERS
// ══════════════════════════════════════════

export type DBUser = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  relationship_xp: number;
  daily_spend_usd: number;
  spend_reset_date: number;
  briefing_cache: string | null;
  briefing_generated_at: number | null;
  is_pro: number;
  created_at: number;
};

export function findUserByEmail(email: string): DBUser | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
    .get(email.toLowerCase()) as DBUser | undefined;
}

export function findUserById(id: string): DBUser | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | DBUser
    | undefined;
}

export function createUser(user: {
  id: string;
  name: string;
  email: string;
  password_hash: string;
}): DBUser {
  const db = getDb();
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash)
     VALUES (@id, @name, @email, @password_hash)`
  ).run(user);
  return findUserById(user.id)!;
}

export function updateUserProStatus(id: string, isPro: boolean) {
  const db = getDb();
  db.prepare("UPDATE users SET is_pro = ? WHERE id = ?").run(isPro ? 1 : 0, id);
}

// ══════════════════════════════════════════
// CONVERSATION HELPERS
// ══════════════════════════════════════════

export type DBConversation = {
  id: string;
  user_id: string;
  title: string;
  provider: string;
  model: string;
  is_starred: number;
  created_at: number;
  updated_at: number;
};

export function getUserConversations(userId: string): DBConversation[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC"
    )
    .all(userId) as DBConversation[];
}

export function findConversation(id: string): DBConversation | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM conversations WHERE id = ?").get(id) as
    | DBConversation
    | undefined;
}

export function createConversation(conv: {
  id: string;
  user_id: string;
  title: string;
  provider?: string;
  model?: string;
}): DBConversation {
  const db = getDb();
  db.prepare(
    `INSERT INTO conversations (id, user_id, title, provider, model)
     VALUES (@id, @user_id, @title, @provider, @model)`
  ).run({
    id: conv.id,
    user_id: conv.user_id,
    title: conv.title,
    provider: conv.provider || "anthropic",
    model: conv.model || "claude-sonnet-4-20250514",
  });
  return findConversation(conv.id)!;
}

export function updateConversationTitle(id: string, title: string) {
  const db = getDb();
  db.prepare(
    "UPDATE conversations SET title = ?, updated_at = unixepoch() WHERE id = ?"
  ).run(title, id);
}

export function touchConversation(id: string) {
  const db = getDb();
  db.prepare(
    "UPDATE conversations SET updated_at = unixepoch() WHERE id = ?"
  ).run(id);
}

export function toggleConversationStar(id: string, isStarred: number) {
  const db = getDb();
  db.prepare(
    "UPDATE conversations SET is_starred = ?, updated_at = unixepoch() WHERE id = ?"
  ).run(isStarred, id);
}

export function deleteConversation(id: string) {
  const db = getDb();
  db.prepare("DELETE FROM conversations WHERE id = ?").run(id);
}

// ══════════════════════════════════════════
// MESSAGE HELPERS
// ══════════════════════════════════════════

export type DBMessage = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  status: string;
  reactions: string;
  tool_use_id: string | null;
  created_at: number;
};

export function getConversationMessages(
  conversationId: string
): DBMessage[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC"
    )
    .all(conversationId) as DBMessage[];
}

export function insertMessage(msg: {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  status?: string;
  tool_use_id?: string;
}) {
  const db = getDb();
  db.prepare(
    `INSERT INTO messages (id, conversation_id, role, content, status, tool_use_id)
     VALUES (@id, @conversation_id, @role, @content, @status, @tool_use_id)`
  ).run({
    id: msg.id,
    conversation_id: msg.conversation_id,
    role: msg.role,
    content: msg.content,
    status: msg.status || "complete",
    tool_use_id: msg.tool_use_id || null,
  });
}

export function deleteMessagesFrom(conversationId: string, messageId: string) {
  const db = getDb();
  const targetMsg = db.prepare("SELECT created_at FROM messages WHERE id = ? AND conversation_id = ?").get(messageId, conversationId) as { created_at: number } | undefined;
  if (targetMsg) {
    db.prepare("DELETE FROM messages WHERE conversation_id = ? AND created_at >= ?").run(conversationId, targetMsg.created_at);
  }
}

// ══════════════════════════════════════════
// REFRESH TOKEN HELPERS
// ══════════════════════════════════════════

export function insertRefreshToken(token: {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: number;
  user_agent?: string;
  ip?: string;
}) {
  const db = getDb();
  db.prepare(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, user_agent, ip)
     VALUES (@id, @user_id, @token_hash, @expires_at, @user_agent, @ip)`
  ).run({
    ...token,
    user_agent: token.user_agent || null,
    ip: token.ip || null,
  });
}

export function findRefreshTokenByHash(
  hash: string
): { id: string; user_id: string; token_hash: string; expires_at: number } | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM refresh_tokens WHERE token_hash = ?")
    .get(hash) as any;
}

export function deleteRefreshToken(id: string) {
  const db = getDb();
  db.prepare("DELETE FROM refresh_tokens WHERE id = ?").run(id);
}

export function deleteUserRefreshTokens(userId: string) {
  const db = getDb();
  db.prepare("DELETE FROM refresh_tokens WHERE user_id = ?").run(userId);
}

// ── OAuth Tokens ──

export type DBOAuthToken = {
  id: string;
  user_id: string;
  provider: string;
  access_token_enc: string;
  refresh_token_enc?: string | null;
  expires_at?: number | null;
  scope?: string | null;
  created_at: number;
};

export function upsertOAuthToken(token: Omit<DBOAuthToken, "created_at">) {
  const db = getDb();
  db.prepare(
    `INSERT INTO oauth_tokens (id, user_id, provider, access_token_enc, refresh_token_enc, expires_at, scope)
     VALUES (@id, @user_id, @provider, @access_token_enc, @refresh_token_enc, @expires_at, @scope)
     ON CONFLICT(user_id, provider) DO UPDATE SET
       access_token_enc = excluded.access_token_enc,
       refresh_token_enc = COALESCE(excluded.refresh_token_enc, oauth_tokens.refresh_token_enc),
       expires_at = excluded.expires_at,
       scope = excluded.scope`
  ).run({
    id: token.id,
    user_id: token.user_id,
    provider: token.provider,
    access_token_enc: token.access_token_enc,
    refresh_token_enc: token.refresh_token_enc || null,
    expires_at: token.expires_at || null,
    scope: token.scope || null,
  });
}

export function getOAuthToken(userId: string, provider: string): DBOAuthToken | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM oauth_tokens WHERE user_id = ? AND provider = ?")
    .get(userId, provider) as DBOAuthToken | undefined;
}

export function deleteOAuthToken(userId: string, provider: string) {
  const db = getDb();
  db.prepare("DELETE FROM oauth_tokens WHERE user_id = ? AND provider = ?").run(userId, provider);
}
