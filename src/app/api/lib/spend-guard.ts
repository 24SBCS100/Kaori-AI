import { getDb, mapRows } from "./db";

const DAILY_LIMIT = parseFloat(process.env.DAILY_SPEND_LIMIT_USD || "2.00");

/**
 * Check if user has budget remaining for this request.
 * Throws a 429 Response if daily limit exceeded.
 */
export async function checkSpend(
  userId: string,
  estimatedCostUsd: number
): Promise<void> {
  const db = await getDb();
  const rows = mapRows<{
    daily_spend_usd: number;
    spend_reset_date: number;
  }>(await db.execute({
    sql: "SELECT daily_spend_usd, spend_reset_date FROM users WHERE id = ?",
    args: [userId],
  }));
  const user = rows[0];

  if (!user) return;

  const today = Math.floor(Date.now() / 1000 / 86400);

  // Reset daily counter if day rolled over
  if (user.spend_reset_date < today) {
    await db.execute({
      sql: "UPDATE users SET daily_spend_usd = 0, spend_reset_date = ? WHERE id = ?",
      args: [today, userId],
    });
    user.daily_spend_usd = 0;
  }

  if (user.daily_spend_usd + estimatedCostUsd > DAILY_LIMIT) {
    throw new Response(
      JSON.stringify({
        error: `Daily spend limit ($${DAILY_LIMIT.toFixed(2)}) reached. Resets tomorrow.`,
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Record actual API spend after a successful call.
 */
export async function recordSpend(
  userId: string,
  actualCostUsd: number
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE users SET daily_spend_usd = daily_spend_usd + ? WHERE id = ?",
    args: [actualCostUsd, userId],
  });
}
