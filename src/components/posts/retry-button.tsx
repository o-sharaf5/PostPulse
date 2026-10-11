"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RetryButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function retry() {
    setBusy(true);
    const res = await fetch(`/api/posts/${postId}/retry`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      const { scheduledAt } = (await res.json()) as { scheduledAt: string };
      toast.success(`Re-queued — publishes ${new Date(scheduledAt).toLocaleTimeString()}`);
      router.refresh();
    } else {
      toast.error((await res.json()).error ?? "Retry failed");
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={retry} disabled={busy}>
      {busy ? (
        <Loader2 className="mr-1 size-3.5 animate-spin" />
      ) : (
        <RotateCw className="mr-1 size-3.5" />
      )}
      Retry
    </Button>
  );
}
