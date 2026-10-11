import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/posts/:id — edit content and/or timezone (draft/failed posts only)
export async function PATCH(req: Request, { params }: Ctx) {
  const guard = await requireUser();
  if (!guard.ok) return guard.res;
  const { id } = await params;

  const parsed = z
    .object({ content: z.string().trim().min(1).max(4000).optional() })
    .safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });

  const owned = await prisma.post.findFirst({
    where: { id, clerkUserId: guard.userId },
  });
  if (!owned) return Response.json({ error: "Not found" }, { status:404 });
  if (owned.status === "PUBLISHING" || owned.status === "PUBLISHED") {
    return Response.json({ error: "Cannot edit a post that is publishing or published" }, { status: 409 });
  }

  const post = await prisma.post.update({
    where: { id },
    data: { content: parsed.data.content ?? owned.content },
  });
  return Response.json({ post });
}

// DELETE /api/posts/:id — remove the post (and cascade its publish jobs)
export async function DELETE(_req: Request, { params }: Ctx) {
  const guard = await requireUser();
  if (!guard.ok) return guard.res;
  const { id } = await params;

  const owned = await prisma.post.findFirst({ where: { id, clerkUserId: guard.userId } });
  if (!owned) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.post.delete({ where: { id } });
  return Response.json({ ok: true });
}
