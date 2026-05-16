import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { completeChat } from "@/lib/groq";

const schema = z.object({
  persona: z.string().max(5000).optional(),
  improve: z.boolean().optional(),
});

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad data" }, { status: 400 });
  }

  const { persona, improve } = parsed.data;

  // Если просят улучшить через AI
  if (improve && persona) {
    try {
      const improved = await completeChat({
        messages: [
          {
            role: "system",
            content: `You improve user persona descriptions for a roleplay chat app. The persona tells AI characters who the user is. Make it more vivid, structured and useful for characters to reference. Keep the same language as input. Keep it concise (3-6 sentences). Return ONLY the improved text, no quotes, no preamble.`,
          },
          { role: "user", content: persona },
        ],
        temperature: 0.8,
        maxTokens: 400,
      });
      return NextResponse.json({ persona: improved });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  // Сохранение
  await prisma.user.update({
    where: { id: me.id },
    data: { persona: persona || null },
  });

  return NextResponse.json({ ok: true });
}
