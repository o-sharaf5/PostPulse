import { requireUser } from "@/lib/auth";
import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  scheduledAt: z.iso.datetime(), // ISO 8601 UTC produced by the calendar UI
  accountIds: z.array(z.string()).min(1, "Pick at least one account"),
});

// POST /api/posts/:id/schedule — attach jobs + enqueue the Inngest worker
export async function POST(req: Request, { params }: Ctx) {
  const guard = await requireUser();
  if (!guard.ok) return guard.res;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const when = new Date(parsed.data.scheduledAt);
  if (when.getTime() < Date.now()) {
    return Response.json({ error: "scheduledAt must be in the future" }, { status: 422 });
  }

  // Single transaction: swap stale jobs for fresh ones (so a re-schedule
  // can never leave an old worker pointed at this post), then flip status.
  const post = await prisma.$transaction(async (tx) => {
    const owned = await tx.post.findFirst({
      where: { id, clerkUserId: guard.userId },
    });
    if (!owned) throw new Error("404");
    if (owned.status === "PUBLISHED" || owned.status === "PUBLISHING") {
      throw new Error("409");
    }

    await tx.publishJob.deleteMany({ where: { postId: id } });

    const accounts = await tx.socialAccount.findMany({
      where: { id: { in: parsed.data.accountIds }, clerkUserId: guard.userId },
    });
    if (accounts.length !== parsed.data.accountIds.length) throw new Error("403");

    await tx.publishJob.createMany({
      data: accounts.map((a) => ({
        postId: id,
        socialAccountId: a.id,
        platform: a.platform,
      })),
    });

    return tx.post.update({
      where: { id },
      data: { status: "SCHEDULED", scheduledAt: when, publishedAt: null },
    });
  }).catch((e: Error) => {
    if (e.message === "404") return Response.json({ error: "Not found" }, { status: 404 });
    if (e.message === "409")
      return Response.json({ error: "Post is already publishing or published" }, { status: 409 });
    if (e.message === "403")
      return Response.json({ error: "One or more accounts not owned by you" }, { status: 403 });
    throw e;
  });
  if (post instanceof Response) return post;

  await inngest.send({ name: "post.publish.scheduled", data: { postId: id } });
  return Response.json({ ok: true, scheduledAt: post.scheduledAt });
}

// DELETE /api/posts/:id/schedule — unschedule (cancels any in-flight worker)
export async function DELETE(_req: Request, { params }: Ctx) {
  const guard = await requireUser();
  if (!guard.ok) return guard.res;
  const { id } = await params;

  const owned = await prisma.post.findFirst({ where: { id, clerkUserId: guard.userId } });
  if (!owned) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    prisma.post.update({
      where: { id },
      data: { status: "CANCELED", scheduledAt: null },
    }),
    prisma.publishJob.deleteMany({ where: { postId: id } }),
  ]);
  // cancelOn in the worker tears down the sleeping function on this event.
  await inngest.send({ name: "post.publish.canceled", data: { postId: id } });
  return Response.json({ ok: true });
}
