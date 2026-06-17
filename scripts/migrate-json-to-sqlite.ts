// scripts/migrate-json-to-sqlite.ts
// Migrates existing JSON flat-file data into the configured Turso database.
// Usage: npx tsx scripts/migrate-json-to-sqlite.ts

import { createClient } from "@tursodatabase/serverless/compat";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const USERS_JSON = path.join(process.cwd(), ".data/users.json");
const CHATS_JSON = path.join(process.cwd(), ".data/chats.json");
const SCHEMA_PATH = path.join(process.cwd(), "db/schema.sql");

type JsonUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt?: string;
};

type JsonChat = {
  id: string;
  userId: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  messages?: Array<{
    id?: string;
    role: "user" | "assistant" | "tool";
    content: unknown;
    timestamp?: string;
  }>;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function toUnixSeconds(value?: string): number {
  if (!value) return Math.floor(Date.now() / 1000);
  return Math.floor(new Date(value).getTime() / 1000);
}

async function migrate() {
  console.log("Starting JSON to Turso migration...");

  const db = createClient({
    url: requireEnv("TURSO_DATABASE_URL"),
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");
  await db.execute("PRAGMA foreign_keys = ON");
  await db.executeMultiple(schema);
  console.log("Schema applied");

  const users: JsonUser[] = fs.existsSync(USERS_JSON)
    ? JSON.parse(fs.readFileSync(USERS_JSON, "utf-8") || "[]")
    : [];

  const chats: JsonChat[] = fs.existsSync(CHATS_JSON)
    ? JSON.parse(fs.readFileSync(CHATS_JSON, "utf-8") || "[]")
    : [];

  const statements = [];

  for (const user of users) {
    statements.push({
      sql: `INSERT OR IGNORE INTO users (id, name, email, password_hash, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        user.id,
        user.name,
        user.email,
        user.passwordHash,
        toUnixSeconds(user.createdAt),
      ],
    });
  }

  for (const chat of chats) {
    const createdAt = toUnixSeconds(chat.createdAt);
    const updatedAt = chat.updatedAt ? toUnixSeconds(chat.updatedAt) : createdAt;

    statements.push({
      sql: `INSERT OR IGNORE INTO conversations (id, user_id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [chat.id, chat.userId, chat.title || "New Chat", createdAt, updatedAt],
    });

    for (const message of chat.messages || []) {
      statements.push({
        sql: `INSERT OR IGNORE INTO messages (id, conversation_id, role, content, created_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          message.id || crypto.randomUUID(),
          chat.id,
          message.role,
          typeof message.content === "string"
            ? message.content
            : JSON.stringify(message.content),
          toUnixSeconds(message.timestamp),
        ],
      });
    }
  }

  if (statements.length) {
    await db.batch(statements, "write");
  }

  const userCount = (await db.execute("SELECT COUNT(*) AS c FROM users")).rows[0]
    ?.c;
  const convCount = (
    await db.execute("SELECT COUNT(*) AS c FROM conversations")
  ).rows[0]?.c;
  const msgCount = (await db.execute("SELECT COUNT(*) AS c FROM messages"))
    .rows[0]?.c;

  console.log("Migration complete:");
  console.log(`  ${userCount ?? 0} users`);
  console.log(`  ${convCount ?? 0} conversations`);
  console.log(`  ${msgCount ?? 0} messages`);
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
