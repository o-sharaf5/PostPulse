"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownToLine, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Idea = { hook: string; outline: string };

export function IdeasPanel() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<"X" | "LINKEDIN" | "BOTH">("X");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [busy, setBusy] = useState(false);
  const [savedIndex, setSavedIndex] = useState<number | null>(null);

  async function generate() {
    if (!topic.trim()) return toast.error("Enter a topic first");
    setBusy(true);
    setSavedIndex(null);
    try {
      const res = await fetch("/api/ai/ideas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, platform, count: 5 }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "AI request failed");
      const json = (await res.json()) as { ideas: Idea[] };
      setIdeas(json.ideas);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveAsDraft(idea: Idea, index: number) {
    const content = `${idea.hook}\n\n${idea.outline}`.trim();
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        content,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });
    if (res.ok) {
      setSavedIndex(index);
      toast.success("Saved as draft — find it in the calendar");
      router.refresh();
    } else {
      toast.error("Could not save");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wand2 className="size-4" />
          </span>
          AI idea generator
        </CardTitle>
        <CardDescription>
          Enter a topic in your niche; get platform-aware hooks and outlines you
          can drop straight into the calendar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. shipping side projects faster"
            className="min-w-56 flex-1"
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
          <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="X">X</SelectItem>
              <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
              <SelectItem value="BOTH">Both</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generate} disabled={busy} className="shadow-sm shadow-primary/20">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
            Generate
          </Button>
        </div>

        {ideas.length > 0 && (
          <ul className="grid gap-2">
            {ideas.map((idea, i) => (
              <li
                key={i}
                className="group flex items-start justify-between gap-3 rounded-lg border bg-card p-3.5 transition-colors hover:border-primary/30"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug">{idea.hook}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{idea.outline}</p>
                </div>
                <Button
                  variant={savedIndex === i ? "secondary" : "outline"}
                  size="sm"
                  className="shrink-0"
                  disabled={savedIndex !== null && savedIndex !== i}
                  onClick={() => saveAsDraft(idea, i)}
                >
                 <ArrowDownToLine className="size-3.5" />
                  {savedIndex === i ? "Saved" : "Use"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
