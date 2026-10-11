"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PostDTO } from "@/lib/types";
import { STATUS_DOT } from "@/lib/types";
import { PostEditorDialog } from "./post-editor-dialog";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ posts }: { posts: PostDTO[] }) {
  const router = useRouter();
  const [cursor, setCursor] = useState(() => new Date());
  const [editing, setEditing] = useState<PostDTO | "new" | null>(null);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(cursor));
    const gridEnd = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [cursor]);

  const postsOn = useCallback(
    (day: Date) =>
      posts.filter((p) => {
        const t = p.scheduledAt ?? p.publishedAt;
        return t ? isSameDay(parseISO(t), day) : false;
      }),
    [posts],
  );

  const refresh = useCallback(() => router.refresh(), [router]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight">{format(cursor, "MMMM yyyy")}</h2>
          <div className="flex items-center rounded-lg border bg-card">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCursor(subMonths(cursor, 1))}
              aria-label="Previous month"
              className="rounded-r-none"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="w-px self-stretch bg-border" />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setCursor(addMonths(cursor, 1))}
              aria-label="Next month"
              className="rounded-l-none"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
        </div>
        <Button size="sm" className="shadow-sm" onClick={() => setEditing("new")}>
          <Plus className="size-4" /> New post
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayPosts = postsOn(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "group relative min-h-24 border-b p-1.5 transition-colors hover:bg-accent/40 sm:min-h-28",
                  (i + 1) % 7 !== 0 && "border-r",
                  !isSameMonth(day, cursor) && "bg-muted/30",
                )}
              >
                <div
                  className={cn(
                    "mb-1 flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                    isToday(day)
                      ? "bg-primary font-bold text-primary-foreground shadow-sm"
                      : isSameMonth(day, cursor)
                        ? "text-foreground"
                        : "text-muted-foreground/60",
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setEditing(p)}
                      className={cn(
                        "flex w-full items-center gap-1.5 rounded-md bg-muted/80 px-1.5 py-1 text-left text-[11px] font-medium leading-tight transition-all",
                        "hover:bg-primary/10 hover:text-primary hover:shadow-sm",
                        !isSameMonth(day, cursor) && "opacity-50",
                      )}
                      title={p.content.slice(0, 140)}
                    >
                      <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[p.status])} />
                      <span className="truncate">
                        {p.scheduledAt ? `${format(parseISO(p.scheduledAt), "HH:mm")} ` : ""}
                        {p.content.slice(0, 34)}
                      </span>
                    </button>
                  ))}
                  {dayPosts.length > 3 && (
                    <div className="px-1.5 text-[10px] font-medium text-muted-foreground">
                      +{dayPosts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {(["SCHEDULED", "PUBLISHING", "PUBLISHED", "FAILED"] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", STATUS_DOT[s])} />
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </span>
        ))}
      </div>

      {editing !== null && (
        <PostEditorDialog
          key={editing === "new" ? "new" : editing.id}
          post={editing === "new" ? null : editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
