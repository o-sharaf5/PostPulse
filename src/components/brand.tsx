import Link from "next/link";
import { Activity, Zap } from "lucide-react";
import type { Platform } from "@prisma/client";
import { cn } from "@/lib/utils";

export function Brand({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2", className)}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-sm">
        <Activity className="size-4" strokeWidth={2.5} />
      </span>
      <span className="text-[15px] font-bold tracking-tight">
        Post<span className="text-primary">Pulse</span>
      </span>
    </Link>
  );
}

function LinkedInGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="LinkedIn">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

export function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  if (platform === "LINKEDIN") return <LinkedInGlyph className={className} />;
  if (platform === "MOCK") return <Zap className={className} aria-label="Demo" />;
  return (
    <span className={cn("inline-flex items-center justify-center font-black leading-none", className)} aria-label="X">
      𝕏
    </span>
  );
}
