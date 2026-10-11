import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Ensures a Profile row exists for the signed-in Clerk user (lazy upsert —
 * no webhook needed to get started). Returns when unauthenticated.
 */
export async function getOrCreateProfile() {
  const { userId } = await auth();
  if (!userId) return null;

  const profile = await prisma.profile.upsert({
    where: { clerkUserId: userId },
    update: {},
    create: { clerkUserId: userId },
  });
  return profile;
}

/** API-route guard: returns a 401 response when there is no session. */
export async function requireUser(): Promise<
  { ok: true; userId: string } | { ok: false; res: Response }
> {
  const { userId } = await auth();
  if (!userId) {
    return {
      ok: false,
      res: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  await prisma.profile.upsert({
    where: { clerkUserId: userId },
    update: {},
    create: { clerkUserId: userId },
  });
  return { ok: true, userId };
}
