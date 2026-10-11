/**
 * Seeds a demo MOCK account + 3 posts so the calendar looks alive.
 * Targets, in order of preference:
 *   1. SEED_USER_ID env var (a Clerk user id like user_...)
 *   2. The first real profile in the DB (i.e. you, after signing up)
 *   3. Creates a placeholder profile (only if the DB is empty — sign up
 *      first and re-run so the demo data lands on YOUR account)
 * Idempotent: skips seeding if the target user already has posts.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const prisma = new PrismaClient();

function encrypt(plaintext: string): string {
  const key = Buffer.from(process.env.TOKEN_KEY!, "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [iv.toString("base64"), enc.toString("base64"), cipher.getAuthTag().toString("base64")].join(".");
}

async function main() {
  let clerkUserId = process.env.SEED_USER_ID;

  if (!clerkUserId) {
    const first = await prisma.profile.findFirst({ orderBy: { createdAt: "asc" } });
    if (first) {
      clerkUserId = first.clerkUserId;
      console.log(`Using existing profile: ${clerkUserId}`);
    } else {
      clerkUserId = "user_demo_postpulse";
      await prisma.profile.upsert({
        where: { clerkUserId },
        update: {},
        create: { clerkUserId, displayName: "Demo Creator", email: "demo@postpulse.app" },
      });
      console.log(`No profiles found — created placeholder ${clerkUserId}.`);
      console.log(`Sign up in the app first, then re-run: SEED_USER_ID=<your user id> npm run db:seed`);
    }
  }

  const existing = await prisma.post.count({ where: { clerkUserId } });
  if (existing > 0) {
    console.log(`User ${clerkUserId} already has ${existing} posts — skipping seed.`);
    return;
  }

  const mock = await prisma.socialAccount.upsert({
    where: {
      clerkUserId_platform_externalId: { clerkUserId, platform: "MOCK", externalId: "mock-demo" },
    },
    update: {},
    create: {
      clerkUserId,
      platform: "MOCK",
      externalId: "mock-demo",
      displayName: "Demo account (MOCK)",
      handle: "@demo",
      accessTokenEnc: encrypt("mock-token"),
    },
  });

  const now = Date.now();
  const posts = [
    { content: "Shipped a side project in 5 days. Here's the plan I followed (and what I'd cut next time).", status: "PUBLISHED" as const, offset: -2 * 86_400_000 },
    { content: "Unpopular opinion: your second factor in production is not your codebase — it's your error budgets.", status: "SCHEDULED" as const, offset: 86_400_000 },
    { content: "Notes from migrating a scheduler to durable jobs: the queue never loses time, but your data model will.", status: "DRAFT" as const, offset: 0 },
  ];

  for (const p of posts) {
    const when = new Date(now + p.offset);
    const post = await prisma.post.create({
      data: {
        clerkUserId,
        content: p.content,
        status: p.status,
        scheduledAt: p.status === "DRAFT" ? null : when,
        publishedAt: p.status === "PUBLISHED" ? when : null,
        timezone: "UTC",
      },
    });
    if (p.status !== "DRAFT") {
      await prisma.publishJob.create({
        data: {
          postId: post.id,
          socialAccountId: mock.id,
          platform: "MOCK",
          status: p.status === "PUBLISHED" ? "SUCCEEDED" : "PENDING",
          externalPostId: p.status === "PUBLISHED" ? `mock-${crypto.randomUUID()}` : null,
          publishedAt: p.status === "PUBLISHED" ? when : null,
        },
      });
    }
  }

  console.log(`Seeded ${clerkUserId} with 1 demo account and 3 posts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
