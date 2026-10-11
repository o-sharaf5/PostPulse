import { redirect } from "next/navigation";
import { CalendarClock, CircleCheck, FilePen, TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PostDTO } from "@/lib/types";
import { CalendarView } from "@/components/posts/calendar-view";
import { StatTile } from "@/components/dashboard/stat-tile";

export const instant = false;

export default async function DashboardPage() {
  const guard = await requireUser();
  if (!guard.ok) redirect("/sign-in"); // proxy.ts already protects; belt-and-suspenders

  const [posts, counts] = await Promise.all([
    prisma.post.findMany({
      where: { clerkUserId: guard.userId },
      orderBy: { scheduledAt: { sort: "asc", nulls: "last" } },
      include: {
        jobs: {
          select: { platform: true, status: true, externalPostId: true, error: true },
        },
      },
    }),
    prisma.post.groupBy({
      by: ["status"],
      where: { clerkUserId: guard.userId },
      _count: true,
    }),
  ]);

  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  const dtos: PostDTO[] = posts.map((p) => ({
    id: p.id,
    content: p.content,
    status: p.status,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    timezone: p.timezone,
    jobs: p.jobs,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Click any card to edit, enhance with AI, or schedule it.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Scheduled" value={count("SCHEDULED")} icon={CalendarClock} tone="blue" />
        <StatTile label="Published" value={count("PUBLISHED")} icon={CircleCheck} tone="green" />
        <StatTile label="Drafts" value={count("DRAFT")} icon={FilePen} tone="muted" />
        <StatTile label="Failed" value={count("FAILED")} icon={TriangleAlert} tone="red" />
      </div>

      <CalendarView posts={dtos} />
    </div>
  );
}
