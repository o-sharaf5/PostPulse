"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Link2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon } from "@/components/brand";
import { PLATFORM_LABEL, type AccountDTO } from "@/lib/types";

export function AccountsManager({ accounts }: { accounts: AccountDTO[] }) {
  const router = useRouter();
  const [addingMock, setAddingMock] = useState(false);

  async function addMock() {
    setAddingMock(true);
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ platform: "MOCK" }),
    });
    setAddingMock(false);
    if (res.ok) {
      toast.success("Demo account added — posts sent to it always publish successfully.");
      router.refresh();
    } else {
      toast.error((await res.json()).error ?? "Could not add demo account");
    }
  }

  const hasX = accounts.some((a) => a.platform === "X");
  const hasLI = accounts.some((a) => a.platform === "LINKEDIN");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected accounts</CardTitle>
        <CardDescription>
          Choose publishing targets. X needs API v2 write access and LinkedIn needs
          app review for the posting scope — approvals can take time, so a demo
          account lets you run the full schedule → publish pipeline today.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {accounts.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No accounts connected yet.
          </div>
        ) : (
          <ul className="divide-y overflow-hidden rounded-lg border">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <PlatformIcon platform={a.platform} className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{a.displayName}</span>
                  {a.handle && <span className="block text-xs text-muted-foreground">{a.handle}</span>}
                </span>
                <Badge variant="outline">{PLATFORM_LABEL[a.platform]}</Badge>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          {hasX ? (
            <Badge variant="outline" className="h-9 gap-1.5 self-center rounded-lg px-3 font-medium">
              <Check className="size-3.5 text-emerald-500" /> X connected
            </Badge>
          ) : (
            <a href="/api/auth/x/start">
              <Button variant="outline" size="sm" className="h-9">
                <Link2 className="size-4" /> Connect X
              </Button>
            </a>
          )}
          {hasLI ? (
            <Badge variant="outline" className="h-9 gap-1.5 self-center rounded-lg px-3 font-medium">
              <Check className="size-3.5 text-emerald-500" /> LinkedIn connected
            </Badge>
          ) : (
            <a href="/api/auth/linkedin/start">
              <Button variant="outline" size="sm" className="h-9">
                <Link2 className="size-4" /> Connect LinkedIn
              </Button>
            </a>
          )}
          <Button variant="secondary" size="sm" className="h-9" onClick={addMock} disabled={addingMock}>
            <Zap className="size-4 text-primary" />
            {addingMock ? "Adding…" : "Add demo account"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
