import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  buildSystemPrompt,
  ChatMsg,
  fitHistory,
  streamChat,
  summarizeMessages,
} from "@/lib/groq";

export const runtime = "nodejs";
export const maxDuration = 60;

const postSchema = z.object({
  content: z.string().min(1).max(8000).optional(),
  regenerate: z.boolean().optional(),
  model: z.string().max(60).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return new Response("Bad data", { status: 400 });
  const { content, regenerate, model: requestedModel } = parsed.data;
  if (!content && !regenerate) return new Response("Bad data", { status: 400 });

  // Проверяем доступ к премиум-модели
  const fullUser = await prisma.user.findUnique({ where: { id: me.id }, select: { isPremium: true, persona: true } });
  const useSmartModel = requestedModel === "gpt-5.5" && fullUser?.isPremium;
  const isPremium = fullUser?.isPremium || false;

  const chat = await prisma.chat.findUnique({
    where: { id: params.id },
    include: { character: true },
  });
  if (!chat || chat.userId !== me.id) {
    return new Response("Not found", { status: 404 });
  }

  // Лимит сообщений для бесплатных (50/день)
  if (!isPremium) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await prisma.message.count({
      where: {
        chat: { userId: me.id },
        role: "user",
        createdAt: { gte: today },
      },
    });
    if (count >= 50) {
      return new Response(
        "Лимит 50 сообщений в день. Оформи CharacterLab+ для безлимита.",
        { status: 429 },
      );
    }
  }

  // Если regenerate — удаляем последнее assistant-сообщение
  if (regenerate) {
    const last = await prisma.message.findFirst({
      where: { chatId: chat.id },
      orderBy: { createdAt: "desc" },
    });
    if (last && last.role === "assistant") {
      await prisma.message.delete({ where: { id: last.id } });
    }
  }

  // Сохраняем сообщение пользователя (если есть)
  if (content) {
    await prisma.message.create({
      data: { chatId: chat.id, role: "user", content },
    });
  }

  // Собираем контекст
  const all = await prisma.message.findMany({
    where: { chatId: chat.id },
    orderBy: { createdAt: "asc" },
  });

  const system = buildSystemPrompt({
    name: chat.character.name,
    kind: (chat.character as any).kind,
    personality: chat.character.personality,
    temperament: chat.character.temperament,
    systemPrompt: chat.character.systemPrompt,
    memory: chat.character.memory,
    knowledge: (chat.character as any).knowledge,
    greeting: chat.character.greeting,
    exampleDialog: chat.character.exampleDialog,
    summary: chat.summary,
    username: me.username,
    persona: fullUser?.persona || (me as any).persona,
  });

  const history: ChatMsg[] = all.map((m) => ({
    role: m.role as ChatMsg["role"],
    content: m.content,
  }));

  // Оставляем место под system + генерацию (Plus = больше контекста)
  const tokenBudget = isPremium ? 8000 : 4500;
  const { kept, dropped } = fitHistory(history, tokenBudget);
  const messages: ChatMsg[] = [{ role: "system", content: system }, ...kept];

  // Фоновое саммари, если много выпавших сообщений
  if (dropped.length >= 6) {
    summarizeMessages(dropped, chat.summary)
      .then(async (s) => {
        if (s) {
          await prisma.chat.update({
            where: { id: chat.id },
            data: { summary: s },
          });
        }
      })
      .catch(() => {});
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        const maxTokens = isPremium ? 1500 : 800;
        const groqStream = await streamChat({ messages, temperature: 0.9, maxTokens, model: useSmartModel ? "gpt-5.5" : undefined });
        for await (const chunk of groqStream) {
          const delta = chunk.choices[0]?.delta?.content || "";
          if (delta) {
            full += delta;
            controller.enqueue(encoder.encode(delta));
          }
        }
      } catch (e: any) {
        const msg = `\n[ошибка: ${e.message || "generation failed"}]`;
        full += msg;
        controller.enqueue(encoder.encode(msg));
      } finally {
        try {
          if (full.trim()) {
            await prisma.message.create({
              data: {
                chatId: chat.id,
                role: "assistant",
                content: full,
              },
            });
            await prisma.chat.update({
              where: { id: chat.id },
              data: { updatedAt: new Date() },
            });
            await prisma.character.update({
              where: { id: chat.characterId },
              data: { messagesCount: { increment: 1 } },
            });
          }
        } catch {}
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
