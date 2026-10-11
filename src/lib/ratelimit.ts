import { prisma } from "@/lib/prisma";

/**
 * DB-backed fixed-window rate limit for the AI routes: each AI call
 * persists an AiSuggestion row, so counting recent rows needs no extra
 * infrastructure and is serverless-safe (no in-memory state).
 * Upgrade to Upstash Ratelimit if you want per-minute buckets or
 * blocking abuse before the OpenAI call is made.
 */
export const AI_WINDOW_MS = 60 * 60_000;
export const AI_LIMIT_PER_HOUR = Number(process.env.AI_LIMIT_PER_HOUR ?? 30);

export async function checkAiRateLimit(
  userId: string,
): Promise<{ ok: true } | { ok: false; res: Response }> {
  const since = new Date(Date.now() - AI_WINDOW_MS);
  const used = await prisma.aiSuggestion.count({
    where: { clerkUserId: userId, createdAt: { gte: since } },
  });
  if (used >= AI_LIMIT_PER_HOUR) {
    return {
      ok: false,
      res: Response.json(
        { error: `AI rate limit reached (${AI_LIMIT_PER_HOUR}/hour). Try again later.` },
        { status: 429, headers: { "retry-after": String(Math.ceil(AI_WINDOW_MS / 1000)) } },
      ),
    };
  }
  return { ok: true };
}
