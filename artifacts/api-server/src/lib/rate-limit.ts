import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { securityRateLimitsTable } from "@workspace/db/schema";

function rateLimitKey(scope: string, subject: string) {
  const digest = createHash("sha256").update(subject).digest("hex");
  return `${scope}:${digest}`;
}

export async function consumeRateLimit(
  scope: string,
  subject: string,
  limit: number,
  windowMs: number,
) {
  const key = rateLimitKey(scope, subject);
  const now = new Date();
  const nextReset = new Date(now.getTime() + windowMs);
  const [row] = await db
    .insert(securityRateLimitsTable)
    .values({ key, count: 1, resetAt: nextReset })
    .onConflictDoUpdate({
      target: securityRateLimitsTable.key,
      set: {
        count: sql<number>`CASE
          WHEN ${securityRateLimitsTable.resetAt} <= ${now} THEN 1
          ELSE ${securityRateLimitsTable.count} + 1
        END`,
        resetAt: sql<Date>`CASE
          WHEN ${securityRateLimitsTable.resetAt} <= ${now} THEN ${nextReset}
          ELSE ${securityRateLimitsTable.resetAt}
        END`,
      },
    })
    .returning({ count: securityRateLimitsTable.count });

  return Boolean(row && row.count <= limit);
}

export async function clearRateLimit(scope: string, subject: string) {
  await db
    .delete(securityRateLimitsTable)
    .where(eq(securityRateLimitsTable.key, rateLimitKey(scope, subject)));
}
