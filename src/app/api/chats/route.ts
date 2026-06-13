import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getSessionUser, requireAjax } from "../lib/auth-utils";
import {
  getUserConversations,
  createConversation,
  getDb,
} from "../lib/db";
import { validateConversationTitle } from "../lib/validation";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convs = getUserConversations(user.id).map((c) => ({
    id: c.id,
    title: c.title,
    isStarred: c.is_starred === 1,
    createdAt: new Date(c.created_at * 1000).toISOString(),
    updatedAt: new Date(c.updated_at * 1000).toISOString(),
  }));

  return NextResponse.json(convs);
}

export async function POST(req: NextRequest) {
  try {
    requireAjax(req);
  } catch (err) {
    if (err instanceof Response) return err;
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const title = validateConversationTitle(body.title);

  const conv = createConversation({
    id: uuid(),
    user_id: user.id,
    title,
  });

  return NextResponse.json({
    id: conv.id,
    title: conv.title,
    createdAt: new Date(conv.created_at * 1000).toISOString(),
    updatedAt: new Date(conv.updated_at * 1000).toISOString(),
  });
}

export async function DELETE(req: NextRequest) {
  try {
    requireAjax(req);
  } catch (err) {
    if (err instanceof Response) return err;
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  // Using cascading deletes or manual deletion for messages
  db.transaction(() => {
    // Delete all messages associated with user's conversations
    db.prepare(`
      DELETE FROM messages 
      WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = ?)
    `).run(user.id);
    
    // Delete the conversations
    db.prepare(`DELETE FROM conversations WHERE user_id = ?`).run(user.id);
  })();

  return NextResponse.json({ success: true });
}
