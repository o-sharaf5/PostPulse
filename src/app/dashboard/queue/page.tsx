import { redirect } from "next/navigation";
import { formatDistanceToNow, parseISO } from "date-fns";
import { CircleCheck, Inbox, TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformIcon } from "@/components/brand";
import { PLATFORM_LABEL } from "@/lib/types";
import { RetryButton } from "@/components/posts/retry-button";

export const instant = false;

export default async function QueuePage() {
  const guard = await requireUser();
  if (!guard.ok) redirect("/sign-in");

  const posts = await prisma.post.findMany({
    where: {
      clerkUserId: guard.userId,
      status: { in: ["SCHEDULED", "PUBLISHING", "FAILED"] },
    },
    orderBy: { scheduledAt: "asc" },
    include: { jobs: { include: { account: { select: { displayName: true } } } } },
  });

  const waiting = posts.filter((p) => p.status === "SCHEDULED" || p.status === "PUBLISHING");
  const failed = posts.filter((p) => p.status === "FAILED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Queue</h1>
        <p className="text-sm text-muted-foreground">
          Everything waiting to publish, and everything that needs attention.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="size-4 text-blue-500" /> Waiting
            <Badge variant="secondary" className="ml-1 tabular-nums">{waiting.length}</Badge>
          </CardTitle>
          <CardDescription>
            Jobs sleeping in Inngest until their publish time — zero compute while waiting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {waiting.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
              <CircleCheck className="size-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Nothing scheduled. Enjoy the quiet.</p>
            </div>
          ) : (
            <ul className="divide-y overflow-hidden rounded-lg border">
              {waiting.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.status === "PUBLISHING"
                        ? "publishing now…"
                        : p.scheduledAt
                          ? `in ${formatDistanceToNow(parseISO(p.scheduledAt.toISOString()), { addSuffix: true })}`
                          : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.jobs.map((j) => (
                      <span
                        key={j.id}
                        className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold"
                        title={`${j.account.displayName} — ${j.status}`}
                      >
                        <PlatformIcon platform={j.platform} className="size-3" />
                        {PLATFORM_LABEL[j.platform]}
                      </span>
                    ))}
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      p.status === "PUBLISHING"
                        ? "border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    }
                  >
                    {p.status === "PUBLISHING" && (
                      <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
                    )}
                    {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className={failed.length > 0 ? "border-red-200 dark:border-red-950" : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TriangleAlert className={failed.length > 0 ? "size-4 text-red-500" : "size-4 text-muted-foreground/50"} />
            Failed
            <Badge variant="secondary" className="ml-1 tabular-nums">{failed.length}</Badge>
          </CardTitle>
          <CardDescription>
            Jobs that errored at publish time — inspect the provider error, fix the
            cause, and retry (re-queues in ~30 seconds).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {failed.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
              <CircleCheck className="size-6 text-emerald-500/70" />
              <p className="text-sm text-muted-foreground">No failures. Nice.</p>
            </div>
          ) : (
            <ul className="divide-y overflow-hidden rounded-lg border">
              {failed.map((p) => (
                <li key={p.id} className="space-y-2 px-4 py-3.5 text-sm">
                  <div className="flex items-center gap-3">
                    <p className="min-w-0 flex-1 truncate font-medium">{p.content}</p>
                    <RetryButton postId={p.id} />
                  </div>
                  {p.jobs.map((j) => (
                    <div key={j.id} className="flex items-start gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold">
                        <PlatformIcon platform={j.platform} className="size-3" />
                        {PLATFORM_LABEL[j.platform]}
                      </span>
                      <span className="text-muted-foreground">
                        {j.attempts} attempt{j.attempts === 1 ? "" : "s"}
                        {j.error ? ` — ${j.error}` : ""}
                      </span>
                    </div>
                  ))}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
