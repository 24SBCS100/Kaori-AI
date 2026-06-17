import { NextRequest } from "next/server";
import { getSessionUser, requireAjax } from "../../lib/auth-utils";
import { updateUserProStatus } from "../../lib/db";
import { logger } from "../../lib/logger";

export async function POST(req: NextRequest) {
  try {
    requireAjax(req);
  } catch (err) {
    if (err instanceof Response) return err;
  }

  const user = await getSessionUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { isPro } = await req.json();

    if (typeof isPro !== "boolean") {
      return new Response(
        JSON.stringify({ error: "isPro must be a boolean" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await updateUserProStatus(user.id, isPro);
    logger.info({ userId: user.id, isPro }, "Updated user pro status");

    return new Response(JSON.stringify({ success: true, is_pro: isPro }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    logger.error({ err }, "Pro status update error");
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    requireAjax(req);
  } catch (err) {
    if (err instanceof Response) return err;
  }

  const user = await getSessionUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ is_pro: user.is_pro }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
