import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PostDTO } from "@/lib/types";
import { PostsList } from "@/components/posts/posts-list";

export const instant = false;

export default async function PostsPage() {
  const guard = await requireUser();
  if (!guard.ok) redirect("/sign-in");

  const posts = await prisma.post.findMany({
    where: { clerkUserId: guard.userId },
    orderBy: { updatedAt: "desc" },
    include: {
      jobs: {
        select: { platform: true, status: true, externalPostId: true, error: true },
      },
    },
  });

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
      <h1 className="text-2xl font-bold tracking-tight">All posts</h1>
      <PostsList posts={dtos} />
    </div>
  );
}
