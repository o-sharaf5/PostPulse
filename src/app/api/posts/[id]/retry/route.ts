import { requireUser } from "@/lib/auth";
import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/posts/:id/retry — re-enqueue publishing for a post whose job(s)
 * failed. Resets FAILED jobs to PENDING, flips the post back to SCHEDULED,
 * and sends the trigger event again. If the original scheduledAt is in the
 * past (or missing), it targets ~30 seconds from now, so the worker's
 * sleepUntil completes promptly and the post publishes on retry.
 */
export async function POST(_req: Request, { params }: Ctx) {
  const guard = await requireUser();
  if (!guard.ok) return guard.res;
  const { id } = await params;

  const post = await prisma.post.findFirst({
    where: { id, clerkUserId: guard.userId },
    include: { jobs: { where: { status: "FAILED" }, select: { id: true } } },
  });
  if (!post) return Response.json({ error: "Not found" }, { status: 404 });
  if (post.jobs.length === 0) {
    return Response.json({ error: "No failed jobs to retry" }, { status: 409 });
  }
  if (post.status === "PUBLISHING") {
    return Response.json({ error: "A publish is already in flight" }, { status: 409 });
  }

  const soon = new Date(Date.now() + 30_000);
  const scheduledAt = post.scheduledAt && post.scheduledAt > soon ? post.scheduledAt : soon;

  await prisma.$transaction([
    prisma.publishJob.updateMany({
      where: { postId: id, status: "FAILED" },
      data: { status: "PENDING", attempts: 0, error: null },
    }),
    prisma.post.update({
      where: { id },
      data: { status: "SCHEDULED", scheduledAt, publishedAt: null },
    }),
  ]);

  await inngest.send({ name: "post.publish.scheduled", data: { postId: id } });
  return Response.json({ ok: true, scheduledAt });
}
