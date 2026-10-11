import OpenAI from "openai";
import { requireUser } from "@/lib/auth";
import { checkAiRateLimit } from "@/lib/ratelimit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const schema = z.object({
  topic: z.string().trim().min(1).max(200),
  platform: z.enum(["X", "LINKEDIN", "BOTH"]),
  count: z.number().int().min(1).max(8).default(5),
});

// POST /api/ai/ideas — generate post ideas for a topic/niche
export async function POST(req: Request) {
  const guard = await requireUser();
  if (!guard.ok) return guard.res;

  const limit = await checkAiRateLimit(guard.userId);
  if (!limit.ok) return limit.res;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { topic, platform, count } = parsed.data;

  const where =
    platform === "BOTH" ? "for X (short, punchy) and LinkedIn (a bit longer)" :
    platform === "X" ? "for X (280 chars max)" : "for LinkedIn";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a content strategist. Generate ${count} distinct, specific, non-generic post ideas ${where} about the given topic. Reply as JSON: {"ideas": [{"hook": string, "outline": string}]}`,
      },
      { role: "user", content: topic },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const ideas = (JSON.parse(raw) as { ideas?: { hook: string; outline: string }[] }).ideas ?? [];

  // Persist each idea as an AiSuggestion so "Adopt" can reference them.
  await prisma.aiSuggestion.createMany({
    data: ideas.map((i) => ({
      clerkUserId: guard.userId,
      kind: "IDEA" as const,
      input: topic,
      output: `${i.hook}\n\n${i.outline}`.trim(),
      tokensUsed: completion.usage ? Math.round(completion.usage.total_tokens / ideas.length) : null,
    })),
  });

  return Response.json({ ideas });
}
