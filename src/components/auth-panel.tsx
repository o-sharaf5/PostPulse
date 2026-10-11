import { Check, Quote } from "lucide-react";
import { Brand } from "@/components/brand";
import { cn } from "@/lib/utils";

const SIGNUP_POINTS = [
  "Interactive calendar + queue",
  "AI hook, rewrite & shorten",
  "Durable auto-publish to X & LinkedIn",
  "Demo account — no API approvals",
];

export function AuthPanel({
  variant,
  className,
}: {
  variant: "signin" | "signup";
  className?: string;
}) {
  const isSignup = variant === "signup";
  return (
    <div
      className={cn(
        "relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-fuchsia-700 p-10 text-white lg:flex",
        className,
      )}
    >
      {/* texture + glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(80%_70%_at_30%_20%,black,transparent)]" />
        <div className="absolute -left-24 top-[-10%] h-80 w-80 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-fuchsia-400/25 blur-3xl" />
      </div>

      {/* Brand is itself a link to home — no wrapper link needed */}
      <div className="relative">
        <Brand className="[&_span:last-child]:text-white" />
      </div>

      <div className="relative max-w-sm">
        <p className="text-3xl font-bold leading-snug tracking-tight">
          {isSignup
            ? "Start publishing in one pulse."
            : "Your next post is already scheduled."}
        </p>
        {isSignup ? (
          <ul className="mt-7 space-y-3.5 text-sm text-white/90">
            {SIGNUP_POINTS.map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
                  <Check className="size-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[15px] leading-relaxed text-white/85">
            Plan on a calendar, polish with AI, and let the durable worker publish to X and
            LinkedIn while you sleep.
          </p>
        )}
      </div>

      {/* testimonial chip */}
      <div className="relative rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-sm">
        <Quote className="size-4 text-white/60" />
        <p className="mt-2 text-sm leading-relaxed text-white/90">
          “Scheduled a week of posts in ten minutes. The AI polish pass alone is worth it.”
        </p>
        <p className="mt-3 text-xs font-medium text-white/60">
          Beta creator · shipping with PostPulse
        </p>
      </div>

      <p className="relative text-xs text-white/60">
        {isSignup ? "Free during beta · No credit card" : "Next.js 16 · Prisma · Clerk · Inngest · OpenAI"}
      </p>
    </div>
  );
}
