import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { PostStatus } from "@prisma/client";

// Mark the module dynamic so the Clerk auth read always happens at request
// time under Cache Components.

const contentSchema = z.string().trim().min(1, "Post cannot be empty").max(4000);

// GET /api/posts?status=SCHEDULED — list the current user's posts
export async function GET(req: Request) {
  const guard = await requireUser();
  if (!guard.ok) return guard.res;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const posts = await prisma.post.findMany({
    where: {
      clerkUserId: guard.userId,
      ...(status ? { status: status as PostStatus } : {}),
      ...(from || to
        ? {
            scheduledAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { scheduledAt: { sort: "asc", nulls: "last" } },
    include: { jobs: { select: { platform: true, status: true, externalPostId: true, error: true } } },
  });

  return Response.json({ posts });
}

// POST /api/posts — create a DRAFT
export async function POST(req: Request) {
  const guard = await requireUser();
  if (!guard.ok) return guard.res;

  const parsed = z
    .object({ content: contentSchema, timezone: z.string().optional() })
    .safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      clerkUserId: guard.userId,
      content: parsed.data.content,
      timezone: parsed.data.timezone ?? "UTC",
    },
  });
  return Response.json({ post }, { status: 201 });
}
