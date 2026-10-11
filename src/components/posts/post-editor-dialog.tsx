"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, Loader2, Sparkles, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PlatformIcon } from "@/components/brand";
import type { PostDTO } from "@/lib/types";
import { PLATFORM_LABEL, STATUS_DOT, STATUS_STYLE } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ScheduleDialog } from "./schedule-dialog";

const AI_ACTIONS = [
  { key: "HOOK", label: "Sharpen hook" },
  { key: "REWRITE", label: "Rewrite" },
  { key: "SHORTEN", label: "Shorten" },
] as const;

type Props = {
  post: PostDTO | null; // null = creating a new draft
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

/**
 * Internal state is initialized from props; callers remount this dialog per
 * post via a `key` prop (the React-recommended "reset state on change"
 * pattern), so no syncing effects are needed.
 */
export function PostEditorDialog({ post, open, onOpenChange, onSaved }: Props) {
  const [content, setContent] = useState(post?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(post?.id ?? null);
  const [status, setStatus] = useState<PostDTO["status"]>(post?.status ?? "DRAFT");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  // Jobs never change within a single editor session (the dialog remounts per post).
  const jobs = post?.jobs ?? [];

  const isLocked = status === "PUBLISHING" || status === "PUBLISHED";
  const overLimit = content.length > 280;

  const ensureSaved = useCallback(async (): Promise<string | null> => {
    if (id) return id;
    if (!content.trim()) {
      toast.error("Write something first.");
      return null;
    }
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
    });
    if (!res.ok) {
      toast.error((await res.json()).error ?? "Could not save draft");
      return null;
    }
    const json = (await res.json()) as { post: PostDTO };
    setId(json.post.id);
    setStatus(json.post.status);
    return json.post.id;
  }, [id, content]);

  async function save() {
    setSaving(true);
    try {
      if (id) {
        const res = await fetch(`/api/posts/${id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else {
        await ensureSaved();
      }
      toast.success("Draft saved");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function enhance(action: (typeof AI_ACTIONS)[number]["key"]) {
    setAiBusy(action);
    try {
      const postId = await ensureSaved();
      if (!postId) return;
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postId, content, instruction: action }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { suggestion } = (await res.json()) as { suggestion: string };
      setContent(suggestion);
      toast.success("Suggestion applied — review before saving");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setAiBusy(null);
    }
  }

  async function remove() {
    if (!id) return onOpenChange(false);
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Post deleted");
      onOpenChange(false);
      onSaved();
    } else {
      toast.error("Delete failed");
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl gap-0 p-0">
          <DialogHeader className="space-y-0 px-6 pb-4 pt-6">
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <span className="flex-1">{id ? "Edit post" : "New post"}</span>
              <Badge variant="secondary" className={STATUS_STYLE[status]}>
                <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="px-6">
            {/* platform preview */}
            <div className="mb-4 rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {jobs.length > 0 ? (
                  jobs.map((j, i) => (
                    <span key={i} className="inline-flex items-center gap-1 font-medium text-foreground">
                      <PlatformIcon platform={j.platform} className="size-3.5" />
                      {PLATFORM_LABEL[j.platform]}
                    </span>
                  ))
                ) : (
                  <span>Draft — pick accounts when you schedule</span>
                )}
              </div>
              <p className="mt-2 min-h-16 whitespace-pre-wrap text-sm leading-relaxed">
                {content || <span className="text-muted-foreground">Your post preview appears here…</span>}
              </p>
            </div>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What do you want to share today?"
              rows={6}
              disabled={isLocked}
              className="min-h-32 resize-y font-medium"
            />

            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className={cn("tabular-nums", overLimit ? "font-semibold text-red-500" : "text-muted-foreground")}>
                {content.length} chars{overLimit && " · over the 280-char X limit"}
              </span>
              <div className="flex gap-1">
                {jobs.map((j, i) => (
                  <Badge key={i} variant="outline" className="text-[10px]">
                    {PLATFORM_LABEL[j.platform]} · {j.status.toLowerCase()}
                  </Badge>
                ))}
              </div>
            </div>

            {!isLocked && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2">
                <span className="flex items-center gap-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="size-3 text-primary" /> AI
                </span>
                {AI_ACTIONS.map((a) => (
                  <Button
                    key={a.key}
                    variant="secondary"
                    size="sm"
                    disabled={aiBusy !== null || !content.trim()}
                    onClick={() => enhance(a.key)}
                  >
                    {aiBusy === a.key ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5 text-primary" />
                    )}
                    {a.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-2 border-t bg-muted/30 px-6 py-4">
            <Button variant="ghost" size="sm" onClick={remove} disabled={!id && !content} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" /> Delete
            </Button>
            <div className="flex gap-2">
              {!isLocked ? (
                <>
                  <Button variant="outline" size="sm" onClick={save} disabled={saving || !content.trim()}>
                    {saving ? "Saving…" : "Save draft"}
                  </Button>
                  <Button
                    size="sm"
                    className="shadow-sm shadow-primary/20"
                    disabled={!content.trim()}
                    onClick={async () => {
                      const savedId = id ?? (await ensureSaved());
                      if (savedId) {
                        onSaved();
                        setScheduleOpen(true);
                      }
                    }}
                  >
                    <CalendarPlus className="size-4" /> Schedule…
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {id && (
        <ScheduleDialog
          postId={id}
          status={status}
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          onDone={() => {
            onOpenChange(false);
            onSaved();
          }}
        />
      )}
    </>
  );
}
