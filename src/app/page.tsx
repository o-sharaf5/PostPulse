import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Rocket,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { ModeToggle } from "@/components/mode-toggle";

export const instant = false;

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Plan on a calendar",
    body: "Every draft, scheduled, and published post on one interactive month grid — grouped by date, colored by status.",
  },
  {
    icon: Sparkles,
    title: "Enhance with AI",
    body: "Sharpen the hook, rewrite for clarity, or shorten to fit the platform. One click, applied to your draft.",
  },
  {
    icon: Send,
    title: "Publish on autopilot",
    body: "A durable worker sleeps until publish time — surviving restarts and deploys — then posts to X and LinkedIn.",
  },
];

const STEPS = [
  {
    icon: Zap,
    n: "01",
    title: "Write",
    body: "Draft in the editor with live character counts per platform.",
  },
  {
    icon: Sparkles,
    n: "02",
    title: "Polish",
    body: "Run AI enhance until the hook lands, then pick your accounts.",
  },
  {
    icon: Clock,
    n: "03",
    title: "Schedule",
    body: "Drop it on the calendar. PostPulse publishes while you sleep.",
  },
];

const STATS = [
  { value: "2", label: "Platforms, one draft" },
  { value: "3", label: "AI polish actions" },
  { value: "∞", label: "Sleep-through publishing" },
  { value: "0", label: "Credit cards required" },
];

export default async function LandingPage() {
  const { userId } = await auth();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip bg-background">
      {/* ── Ambient background ── */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[42rem]">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute left-1/2 top-[-12rem] h-[32rem] w-[64rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute right-[10%] top-24 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-[100px]" />
      </div>

      {/* ── Nav ─ */}
      <header className="sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-4 sm:px-6">
          <div className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-background/70 px-4 py-2.5 shadow-lg shadow-primary/5 backdrop-blur-xl">
            <Brand />
            <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
              <Link href="#features" className="transition-colors hover:text-foreground">
                Features
              </Link>
              <Link href="#how" className="transition-colors hover:text-foreground">
                How it works
              </Link>
            </nav>
            <div className="flex items-center gap-2">
              <ModeToggle />
              {userId ? (
                <Button asChild size="sm">
                  <Link href="/dashboard">
                    Open dashboard <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                  <Button asChild size="sm" className="shadow-lg shadow-primary/25">
                    <Link href="/sign-up">Start free</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* ── Hero ── */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-24">
          <div className="text-center lg:text-left">
            <Badge variant="secondary" className="mb-6 gap-2 rounded-full px-3.5 py-1.5 text-xs shadow-sm">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              Durable publishing for creators
            </Badge>
            <h1 className="text-balance text-5xl font-extrabold leading-[1.04] tracking-tighter sm:text-6xl">
              Plan, polish, and publish{" "}
              <span className="bg-gradient-to-r from-primary via-primary/85 to-fuchsia-500 bg-clip-text text-transparent">
                in one pulse.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground lg:mx-0">
              The micro content scheduler for X and LinkedIn. Write once, sharpen with AI,
              and let a durable worker publish at exactly the right time.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Button asChild size="lg" className="h-11 px-7 text-[15px] shadow-lg shadow-primary/30">
                <Link href={userId ? "/dashboard" : "/sign-up"}>
                  {userId ? "Go to dashboard" : "Start publishing free"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-7 text-[15px]">
                <Link href="#how">See how it works</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card · Demo account included · Open portfolio project
            </p>
          </div>

          {/* ── Product mock ── */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              aria-hidden
              className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/25 via-transparent to-fuchsia-500/25 blur-2xl"
            />
            <div className="relative rotate-[1.5deg] rounded-2xl border bg-card p-2 shadow-2xl shadow-primary/20 transition-transform duration-500 hover:rotate-0">
              <div className="flex items-center gap-1.5 px-3 py-2">
                <span className="size-2.5 rounded-full bg-red-400/80" />
                <span className="size-2.5 rounded-full bg-amber-400/80" />
                <span className="size-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-3 rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  postpulse.app/dashboard
                </span>
              </div>
              <div className="space-y-2 overflow-hidden rounded-xl border bg-muted/30 p-4">
                {/* mini calendar */}
                <div className="rounded-lg border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">October 2026</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">
                      3 posts
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-muted-foreground">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} className="py-1">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 28 }, (_, i) => {
                      const has = [3, 8, 12, 19, 24].includes(i);
                      const tone =
                        i === 8
                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          : i === 12
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : i === 19
                              ? "bg-red-500/15 text-red-600 dark:text-red-400"
                              : "bg-muted text-muted-foreground";
                      return (
                        <div
                          key={i}
                          className={`flex h-8 flex-col items-center justify-center rounded-md text-[9px] ${
                            i === 12
                              ? "bg-primary font-bold text-primary-foreground shadow-sm shadow-primary/40"
                              : tone
                          }`}
                        >
                          {i + 1}
                          {has && <span className="mt-0.5 size-1 rounded-full bg-current opacity-60" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* mini queue */}
                <div className="rounded-lg border bg-card p-4">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Publish queue
                  </p>
                  {[
                    { p: "X", s: "PUBLISHED", ok: true },
                    { p: "LinkedIn", s: "PENDING", ok: false },
                  ].map((r) => (
                    <div
                      key={r.p}
                      className="flex items-center justify-between border-t py-2 text-[11px] first:border-t-0"
                    >
                      <span className="font-medium">{r.p}</span>
                      <span
                        className={`inline-flex items-center gap-1 ${
                          r.ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                        }`}
                      >
                        {r.ok && <Check className="size-3" />} {r.s}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* floating chips */}
            <div className="animate-float absolute -left-6 top-32 hidden rounded-xl border bg-card/95 px-3 py-2 text-xs shadow-xl backdrop-blur sm:flex sm:items-center sm:gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-3.5" />
              </span>
              <div>
                <p className="font-semibold leading-none">Hook sharpened</p>
                <p className="mt-1 text-[10px] leading-none text-muted-foreground">gpt-4o-mini · 1.2s</p>
              </div>
            </div>
            <div className="animate-float-delay absolute -right-5 bottom-20 hidden rounded-xl border bg-card/95 px-3 py-2 text-xs shadow-xl backdrop-blur sm:flex sm:items-center sm:gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Rocket className="size-3.5" />
              </span>
              <div>
                <p className="font-semibold leading-none">Published on time</p>
                <p className="mt-1 text-[10px] leading-none text-muted-foreground">9:00 AM · X</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats strip ── */}
        <section className="border-y bg-muted/40">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-6 py-10 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ─ */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <div className="mb-14 text-center">
            <Badge variant="outline" className="mb-4 rounded-full px-3 text-[11px]">
              Features
            </Badge>
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Everything a solo creator needs. Nothing they don&apos;t.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Buffer is overkill. A spreadsheet is underkill. PostPulse sits in between.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl bg-gradient-to-b from-primary/25 to-transparent p-px transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="relative h-full overflow-hidden rounded-[calc(1rem-1px)] bg-card p-6">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,var(--primary)/10%,transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <span className="relative mb-5 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-110">
                    <f.icon className="size-5" />
                  </span>
                  <h3 className="relative font-semibold">{f.title}</h3>
                  <p className="relative mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="border-y bg-muted/40">
          <div className="mx-auto max-w-6xl px-6 py-24">
            <div className="mb-14 text-center">
              <Badge variant="outline" className="mb-4 rounded-full px-3 text-[11px]">
                Workflow
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Three steps, zero babysitting</h2>
            </div>
            <div className="relative grid gap-10 md:grid-cols-3 md:gap-8">
              <div
                aria-hidden
                className="absolute left-[16%] right-[16%] top-6 hidden border-t border-dashed border-border md:block"
              />
              {STEPS.map((s) => (
                <div key={s.n} className="relative text-center">
                  <span className="relative z-10 mx-auto flex size-12 items-center justify-center rounded-2xl border bg-card text-primary shadow-md shadow-primary/10">
                    <s.icon className="size-5" />
                  </span>
                  <p className="mt-4 text-xs font-bold tracking-widest text-primary/70">{s.n}</p>
                  <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-fuchsia-600 px-8 py-16 text-center text-primary-foreground shadow-2xl shadow-primary/30 sm:py-20">
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(50%_80%_at_80%_0%,rgba(255,255,255,0.22),transparent_60%)]" />
              <div className="absolute -left-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-12 right-10 size-48 rounded-full bg-fuchsia-300/20 blur-3xl" />
            </div>
            <h2 className="relative text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Your next post is already scheduled.
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-primary-foreground/85">
              Set it up in under two minutes — the demo account publishes without waiting on any API approvals.
            </p>
            <Button
              asChild
              size="lg"
              className="relative mt-8 h-11 bg-white px-7 text-primary shadow-none hover:bg-white/90"
            >
              <Link href={userId ? "/dashboard" : "/sign-up"}>
                {userId ? "Open dashboard" : "Create free account"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <Brand />
          <p className="text-xs">
            Next.js 16 · Prisma · Clerk · Inngest · OpenAI · Shadcn UI — a portfolio build by Omar
          </p>
        </div>
      </footer>
    </div>
  );
}
