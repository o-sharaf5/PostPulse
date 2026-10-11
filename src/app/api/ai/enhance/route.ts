import OpenAI from "openai";
import { requireUser } from "@/lib/auth";
import { checkAiRateLimit } from "@/lib/ratelimit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const schema = z.object({
  postId: z.string().optional(),
  content: z.string().min(1).max(4000),
  instruction: z.enum(["HOOK", "REWRITE", "SHORTEN"]),
});

const SYSTEM: Record<z.infer<typeof schema>["instruction"], string> = {
  HOOK: "You are a social copywriter. Rewrite ONLY the first line as a scroll-stopping hook. Keep the rest of the post unchanged.",
  REWRITE: "You are a social copywriter. Improve clarity, rhythm, and impact. Do not add hashtags unless they were already present.",
  SHORTEN: "Shorten the post while preserving the core message and tone. Respect X's 280-char limit if the text looks like a tweet.",
};

// POST /api/ai/enhance — rewrite/optimize an existing post draft
export async function POST(req: Request) {
  const guard = await requireUser();
  if (!guard.ok) return guard.res;

  const limit = await checkAiRateLimit(guard.userId);
  if (!limit.ok) return limit.res;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { postId, content, instruction } = parsed.data;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `${SYSTEM[instruction]}\nReply as JSON: {"suggestion": string}`,
      },
      { role: "user", content },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const suggestion = (JSON.parse(raw) as { suggestion?: string }).suggestion?.trim();
  if (!suggestion) {
    return Response.json({ error: "AI returned no suggestion" }, { status: 502 });
  }

  await prisma.aiSuggestion.create({
    data: {
      clerkUserId: guard.userId,
      postId: postId ?? null,
      kind: instruction,
      input: content,
      output: suggestion,
      tokensUsed: completion.usage?.total_tokens ?? null,
    },
  });

  return Response.json({ suggestion });
}
