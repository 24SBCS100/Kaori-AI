import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, requireAjax } from "../../lib/auth-utils";
import {
  findConversation,
  getConversationMessages,
  updateConversationTitle,
  toggleConversationStar,
  deleteConversation,
} from "../../lib/db";
import { decryptContent } from "../../lib/crypto";
import { validateConversationTitle } from "../../lib/validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conv = findConversation(id);

  // IDOR: return 404 if not owner or not found
  if (!conv || conv.user_id !== user.id) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const messages = getConversationMessages(id).map((m) => ({
    id: m.id,
    role: m.role,
    content: decryptContent(m.content),
    timestamp: new Date(m.created_at * 1000).toISOString(),
  }));

  return NextResponse.json({
    id: conv.id,
    userId: conv.user_id,
    title: conv.title,
    isStarred: conv.is_starred === 1,
    messages,
    createdAt: new Date(conv.created_at * 1000).toISOString(),
    updatedAt: new Date(conv.updated_at * 1000).toISOString(),
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    requireAjax(req);
  } catch (err) {
    if (err instanceof Response) return err;
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const conv = findConversation(id);

  if (!conv || conv.user_id !== user.id) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  if (body.title !== undefined) {
    updateConversationTitle(id, validateConversationTitle(body.title));
  }
  if (body.is_starred !== undefined) {
    toggleConversationStar(id, body.is_starred ? 1 : 0);
  }

  const updated = findConversation(id)!;
  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    isStarred: updated.is_starred === 1,
    createdAt: new Date(updated.created_at * 1000).toISOString(),
    updatedAt: new Date(updated.updated_at * 1000).toISOString(),
  });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    requireAjax(req);
  } catch (err) {
    if (err instanceof Response) return err;
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const conv = findConversation(id);

  if (!conv || conv.user_id !== user.id) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  deleteConversation(id); // CASCADE deletes messages too
  return NextResponse.json({ ok: true });
}
