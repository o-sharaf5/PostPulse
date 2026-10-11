"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { CalendarPlus, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PLATFORM_LABEL, STATUS_DOT, STATUS_STYLE, type PostDTO } from "@/lib/types";
import { PostEditorDialog } from "./post-editor-dialog";

const FILTERS = ["all", "draft", "scheduled", "published", "failed"] as const;
type Filter = (typeof FILTERS)[number];

export function PostsList({ posts }: { posts: PostDTO[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<PostDTO | "new" | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(
    () =>
      filter === "all"
        ? posts
        : posts.filter((p) => {
            if (filter === "failed") return p.status === "FAILED" || p.status === "CANCELED";
            return p.status === filter.toUpperCase();
          }),
    [posts, filter],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f} value={f} className="capitalize">
                {f}
                {f !== "all" && (
                  <span className="ml-1.5 text-[10px] text-muted-foreground">
                    {posts.filter((p) => (f === "failed" ? p.status === "FAILED" : p.status === f.toUpperCase())).length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button size="sm" className="shadow-sm" onClick={() => setEditing("new")}>
          <PenLine className="size-4" /> New post
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CalendarPlus className="size-6" />
          </span>
          <div>
            <p className="font-medium">
              {filter === "all" ? "No posts yet" : `No ${filter} posts`}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Write one and schedule it — the durable worker wakes up at publish
              time and sends it out for you.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
            <PenLine className="size-4" /> Write your first post
          </Button>
        </div>
      ) : (
        <div className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
          {visible.map((p) => (
            <button
              key={p.id}
              onClick={() => setEditing(p)}
              className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-accent/40"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.content}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {p.scheduledAt
                    ? `Planned ${format(parseISO(p.scheduledAt), "MMM d, HH:mm")}`
                    : p.publishedAt
                      ? `Published ${format(parseISO(p.publishedAt), "MMM d, HH:mm")}`
                      : "Draft — not scheduled"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {p.jobs.map((j, i) => (
                  <span
                    key={i}
                    className="rounded-md border bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold"
                    title={`${PLATFORM_LABEL[j.platform]} — ${j.status}`}
                  >
                    {PLATFORM_LABEL[j.platform]}
                  </span>
                ))}
              </div>
              <Badge variant="secondary" className={cn("shrink-0", STATUS_STYLE[p.status])}>
                <span className={cn("size-1.5 rounded-full", STATUS_DOT[p.status])} />
                {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {editing !== null && (
        <PostEditorDialog
          key={editing === "new" ? "new" : editing.id}
          post={editing === "new" ? null : editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
