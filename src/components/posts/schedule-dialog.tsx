"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlatformIcon } from "@/components/brand";
import { cn } from "@/lib/utils";
import { PLATFORM_LABEL, type AccountDTO, type PostDTO } from "@/lib/types";

type Props = {
  postId: string;
  status: PostDTO["status"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
};

function defaultLocalValue(): string {
  // datetime-local wants "YYYY-MM-DDTHH:mm" in *local* time
  const d = new Date(Date.now() + 5 * 60_000);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleDialog({ postId, status, open, onOpenChange, onDone }: Props) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [when, setWhen] = useState(defaultLocalValue);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((j: { accounts: AccountDTO[] }) => {
        setAccounts(j.accounts ?? []);
        setSelected(j.accounts?.map((a) => a.id) ?? []);
      })
      .catch(() => toast.error("Could not load accounts"));
  }, [open]);

  const alreadyScheduled = status === "SCHEDULED";

  async function schedule() {
    if (!when) return toast.error("Pick a date and time");
    if (selected.length === 0) return toast.error("Pick at least one account");
    setBusy(true);
    try {
      // Local time -> absolute UTC instant. This is the conversion the
      // scheduler depends on: the DB always stores UTC.
      const scheduledAt = new Date(when).toISOString();
      if (alreadyScheduled) {
        await fetch(`/api/posts/${postId}/schedule`, { method: "DELETE" });
      }
      const res = await fetch(`/api/posts/${postId}/schedule`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scheduledAt, accountIds: selected }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(`Scheduled for ${new Date(scheduledAt).toLocaleString()}`);
      onDone();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scheduling failed");
    } finally {
      setBusy(false);
    }
  }

  async function unschedule() {
    setBusy(true);
    const res = await fetch(`/api/posts/${postId}/schedule`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      toast.success("Schedule removed");
      onDone();
      router.refresh();
    } else {
      toast.error("Could not unschedule");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 p-0">
        <DialogHeader className="space-y-0 px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2.5 text-base">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarClock className="size-4" />
            </span>
            {alreadyScheduled ? "Reschedule post" : "Schedule post"}
          </DialogTitle>
          <DialogDescription className="mt-2 pl-[42px]">
            {accounts.length === 0
              ? "No connected accounts yet — add a demo account in Settings."
              : "The worker sleeps until publish time, then posts for you."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="when" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Publish time · your local timezone
            </Label>
            <Input
              id="when"
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Publish to
            </Label>
            <div className="space-y-2">
              {accounts.map((a) => {
                const checked = selected.includes(a.id);
                return (
                  <label
                    key={a.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors",
                      checked ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) =>
                        setSelected((s) => (c ? [...s, a.id] : s.filter((x) => x !== a.id)))
                      }
                    />
                    <span className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <PlatformIcon platform={a.platform} className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{a.displayName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {PLATFORM_LABEL[a.platform]}{a.handle ? ` · ${a.handle}` : ""}
                      </span>
                    </span>
                    {checked && <Check className="size-4 shrink-0 text-primary" />}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="m-0 gap-2 border-t bg-muted/30 px-6 py-4 sm:justify-between">
          {alreadyScheduled ? (
            <Button variant="ghost" size="sm" onClick={unschedule} disabled={busy} className="text-muted-foreground">
              Remove schedule
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={schedule} disabled={busy || accounts.length === 0} className="shadow-sm shadow-primary/20">
              {busy && <Loader2 className="size-4 animate-spin" />}
              {alreadyScheduled ? "Reschedule" : "Schedule it"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
