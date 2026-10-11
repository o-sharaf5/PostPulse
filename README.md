# PostPulse

A lightweight micro content scheduler + AI idea generator for creators on **X** and **LinkedIn**.
Portfolio build: plan posts on a calendar, polish them with AI, and let a durable worker
publish them automatically at the scheduled time.

## Stack

| Concern | Choice                                       |
| ------------ | -------------------------------------------- |
| Framework    | Next.js 16 (App Router, TS, Turbopack)       |
| UI           | Tailwind v4 + Shadcn UI                       |
| DB / ORM     | PostgreSQL (Supabase) + Prisma 6              |
| Auth         | Clerk (`src/proxy.ts` middleware + `auth()`)  |
| Jobs / queue | Inngest (`step.sleepUntil` durable scheduler) |
| AI           | OpenAI (`gpt-4o-mini`)                        |
| Deploy       | Vercel                                        |

## Architecture

```
Browser ── POST /api/posts/:id/schedule ──► Prisma: Post(SCHEDULED) + PublishJob rows
                    │
                    └─► inngest.send("post.publish.scheduled")
                              │
Inngest cloud (or local dev) ─┤ wakes /api/inngest
                              ▼
              publishScheduledPost function
        load-post ► sleepUntil(scheduledAt) ► per-job step.run
                              ▼
                 publishToPlatform (X v2 / LinkedIn / MOCK)
                              ▼
        PublishJob: SUCCEEDED + externalPostId  ──►  Post: PUBLISHED
```

- **`PublishJob` = one post × one target account.** The Post status aggregates job
  outcomes; `externalPostId` and `error` give an auditable publish trail.
- **Cancel / reschedule** works via Inngest `cancelOn` + deleting and recreating jobs
  in one transaction — a stale worker can never fire.
- **`MOCK` platform**: X write access and LinkedIn `w_member_social` need app
  approval; the demo provider "publishes" instantly so the full pipeline works
  end-to-end without waiting on reviews.
- **OAuth tokens** are stored AES-256-GCM-encrypted (`TOKEN_KEY`); access tokens are
  refreshed 5 minutes before expiry inside the worker.

## Features

- **Calendar dashboard** — month grid of drafts, scheduled, published, and failed posts.
- **Post editor with AI** — Sharpen hook / Rewrite / Shorten via `gpt-4o-mini`, applied
  to the draft with one click; every suggestion is persisted to `AiSuggestion`.
- **AI idea generator** — topic → platform-aware hooks + outlines, saved as drafts.
- **Durable scheduler** — Inngest `sleepUntil` worker publishes at the exact time;
  cancel/reschedule tears down sleeping runs via `cancelOn`; failed jobs show the
  provider error and can be **retried** from `/dashboard/queue`.
- **Queue page** — live view of posts waiting to publish + failures with attempt counts.
- **Rate limiting** — AI routes enforce `AI_LIMIT_PER_HOUR` (default 30/hour per user)
  using the `AiSuggestion` table as a no-extra-infra fixed window; swap to Upstash
  Ratelimit when you need stricter buckets.

## Run locally

1. **Provision** a Supabase project → copy the *pooled* connection string.
2. **Env**: `cp .env.example .env` and fill in Clerk + OpenAI keys, `DATABASE_URL`, `TOKEN_KEY`.
3. **Schema**: `npm run db:push`
4. **Start the app**: `npm run dev`
5. **Start the worker**: `npm run worker`
   → opens Inngest Dev Server on **http://localhost:8282** (older CLI) or **http://localhost:8288** (CLI ≥1.46 — check its startup log line `starting server … addr`).
   Local dev needs `INNGEST_DEV=1` in `.env` (already included); remove it in production where real `INNGEST_EVENT_KEY`/`INNGEST_SIGNING_KEY` live.
6. Sign up, add a **demo (MOCK) account** in Settings, write a post, schedule it
   ~2 minutes ahead, and watch it flip to **PUBLISHED** in the calendar.

## Scripts

| Command            | What it does                                        |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Next.js dev server                                  |
| `npm run worker`   | Inngest local dev server → your `/api/inngest`      |
| `npm run db:push`  | Push schema to the database                         |
| `npm run db:studio`| Prisma Studio                                       |
| `npm run db:seed`  | Seed demo user + posts (needs .env)                 |

## Connecting real accounts (later)

- **X**: create an app at developer.x.com → OAuth 2.0 with PKCE, add `tweet.create` +
  `offline.access` → set `X_CLIENT_ID/SECRET`, register redirect
  `<app-url>/api/auth/x/callback`.
- **LinkedIn**: developer portal app → "Share on LinkedIn" product → set
  `LINKEDIN_CLIENT_ID/SECRET`, register redirect `<app-url>/api/auth/linkedin/callback`.
- Both flows are already wired (`/api/auth/*`); they just need the env keys.

## Deploy (Vercel)

1. Push the repo, import in Vercel, paste all `.env` values.
2. Set `INNGEST_EVENT_KEY` (prod) + `INNGEST_SIGNING_KEY`; redeploy registers functions.
3. Point X/LinkedIn redirect URIs at the production URL.

## Notes

- `scheduledAt` is always stored as an absolute UTC instant; the UI does the
  local→UTC conversion in `schedule-dialog.tsx`.

## Gotchas (learned building this)

Next 16 is genuinely different from Next 14/15 — these are the build errors this
stack actually hit, kept here so you can debug them fast:

- **Cache Components are on by default** (`next.config.ts`). `export const
  dynamic = "force-dynamic"` (and friends) are *rejected at build* — routes that
  read cookies/request are already dynamic. Auth-reading pages opt out of
  instant-navigation validation with `export const instant = false` (the
  documented migration escape hatch).
- **`middleware.ts` is now `proxy.ts`**. Clerk ≥7.9 supports it out of the box;
  the file lives at `src/proxy.ts` with the same `clerkMiddleware` export.
- **Clerk + App Router server components**: `<SignedIn>` is not available
  server-side ("Core 3" error). Since proxy.ts already guarantees a session on
  `/dashboard`, use a bare `<UserButton />` under the protected layout. Client
  components (`<SignIn>`, `<SignUp>`) can't sit in the static shell without a
  boundary — wrap them in `<Suspense>` so the page builds as Partial Prerender.
- **Typed routes**: pages/layouts use the generated `LayoutProps<"/">` helpers.
  New route folders need `npx next typegen` before `tsc` sees them (a build does
  it implicitly).
- **Inngest v4 SDK**: `createFunction` takes *both* config and triggers in one
  options object (`triggers: [{ event: ... }]`, no second argument), and there
  is no `step.parallel` — fan out with `Promise.all` over `step.run` calls.
  Step results are JSON-serialized (Dates come back as strings), so steps pass
  only ids and re-query inside each step — which doubles as the race-condition
  guard after the long sleep.
