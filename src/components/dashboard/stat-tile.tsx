import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  muted: "bg-muted text-muted-foreground",
} as const;

export function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: keyof typeof TONES;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", TONES[tone])}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none tabular-nums tracking-tight">{value}</p>
        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
