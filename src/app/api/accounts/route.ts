import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/accounts — the current user's connected publishing targets
export async function GET() {
  const guard = await requireUser();
  if (!guard.ok) return guard.res;

  const accounts = await prisma.socialAccount.findMany({
    where: { clerkUserId: guard.userId },
    select: {
      id: true,
      platform: true,
      displayName: true,
      handle: true,
      pictureUrl: true,
      tokenExpiresAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  return Response.json({ accounts });
}

// POST /api/accounts — quick-add a MOCK account for local/demo publishing.
// (Real X/LinkedIn connections go through the OAuth routes in /api/auth/*.)
export async function POST(req: Request) {
  const guard = await requireUser();
  if (!guard.ok) return guard.res;

  const parsed = z
    .object({
      platform: z.enum(["X", "LINKEDIN", "MOCK"]),
      displayName: z.string().trim().min(1).max(100).optional(),
    })
    .safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });

  if (parsed.data.platform !== "MOCK") {
    return Response.json(
      { error: "Connect X or LinkedIn via Settings → Connect account (OAuth)." },
      { status: 400 },
    );
  }

  const { encrypt } = await import("@/lib/crypto");
  const account = await prisma.socialAccount.create({
    data: {
      clerkUserId: guard.userId,
      platform: "MOCK",
      externalId: `mock-${Date.now()}`,
      displayName: parsed.data.displayName ?? "Demo account (MOCK)",
      handle: "@demo",
      // Static fake token; MOCK publisher ignores it. Stored encrypted anyway
      // so the code path matches the real providers.
      accessTokenEnc: encrypt("mock-token"),
    },
  });

  const safe = { id: account.id, platform: account.platform, displayName: account.displayName };
  return Response.json({ account: safe }, { status: 201 });
}
