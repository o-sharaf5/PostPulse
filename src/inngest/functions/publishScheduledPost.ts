import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/prisma";
import { publishToPlatform } from "@/lib/publish";

/**
 * The scheduled-publishing worker.
 *
 * Triggered by `post.publish.scheduled` when a user schedules a post.
 * The function durably sleeps until `post.scheduledAt` (Inngest persists
 * the wait — no lambda is held open), then publishes to every target
 * account and aggregates the outcome onto the Post row.
 *
 * JSON-safety note: step results are serialized by Inngest, so Date fields
 * come back as strings. Steps therefore pass only string ids between each
 * other and re-query inside `step.run` — also a race-condition guard after
 * the sleep.
 */
export const publishScheduledPost = inngest.createFunction(
  {
    id: "publish-scheduled-post",
    retries: 2,
    // "Unschedule" support: cancelOn kills the in-flight function the moment
    // the user cancels/moves the post. Matching is per-postId.
    cancelOn: [{ event: "post.publish.canceled", match: "data.postId" }],
    // Inngest v4: triggers live inside the options object.
    triggers: [{ event: "post.publish.scheduled" }],
  },

  async ({ event, step }) => {
    const postId = (event.data as { postId: string }).postId;

    // 1. Load and re-validate. Between enqueue and wake-up the user may have
    //    deleted the post, edited it back to DRAFT, or moved the schedule
    //    (which deletes PublishJob rows and re-enqueues — see schedule route).
    //    Returns JSON-safe data: null when there is nothing to publish.
    const target = await step.run("load-post", async () => {
      const p = await prisma.post.findUnique({
        where: { id: postId },
        select: {
          status: true,
          scheduledAt: true,
          jobs: {
            where: { status: "PENDING" },
            select: { id: true, socialAccountId: true, platform: true },
          },
        },
      });
      if (!p || p.status !== "SCHEDULED" || !p.scheduledAt) return null;
      return {
        scheduledAt: p.scheduledAt.toISOString(),
        jobIds: p.jobs.map((j) => j.id),
      };
    });
    if (!target) return;

    // 2. Durable wait until publish time. Accepts an ISO string.
    await step.sleepUntil("wait-until-scheduled-at", target.scheduledAt);

    await step.run("mark-publishing", () =>
      prisma.post.update({
        where: { id: postId },
        data: { status: "PUBLISHING" },
      }),
    );

    // 3. Fan out: one step.run per job. step.run memoizes per step id, so a
    //    retried function never double-publishes a succeeded job. Each step
    //    re-checks PENDING status — the guard against a reschedule that
    //    raced the sleep.
    await Promise.all(
      target.jobIds.map((jobId) =>
        step.run(`publish:${jobId}`, async () => {
          const job = await prisma.publishJob.findFirst({
            where: { id: jobId, status: "PENDING" },
            include: { account: true, post: { select: { content: true } } },
          });
          if (!job) return false; // canceled or already published elsewhere

          await prisma.publishJob.update({
            where: { id: jobId },
            data: { attempts: { increment: 1 } },
          });
          try {
            const externalPostId = await publishToPlatform(
              job.platform,
              job.account,
              job.post.content,
            );
            await prisma.publishJob.update({
              where: { id: jobId },
              data: {
                status: "SUCCEEDED",
                externalPostId,
                publishedAt: new Date(),
                error: null,
              },
            });
            return true;
          } catch (err) {
            await prisma.publishJob.update({
              where: { id: jobId },
              data: {
                status: "FAILED",
                error: err instanceof Error ? err.message : String(err),
              },
            });
            return false;
          }
        }),
      ),
    );

    // 4. Aggregate job results back onto the post
    await step.run("finalize", async () => {
      // Re-count from the DB rather than trusting in-memory outcomes after retries.
      const succeeded = await prisma.publishJob.count({
        where: { postId, status: "SUCCEEDED" },
      });
      return prisma.post.update({
        where: { id: postId },
        data: {
          status: succeeded > 0 ? "PUBLISHED" : "FAILED",
          publishedAt: succeeded > 0 ? new Date() : null,
        },
      });
    });
  },
);
