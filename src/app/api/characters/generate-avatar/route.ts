import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { completeChat } from "@/lib/groq";

const schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  personality: z.string().max(2000).optional(),
  category: z.string().max(60).optional(),
});

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad data" }, { status: 400 });
  }

  const { name, description, personality, category } = parsed.data;

  // Шаг 1: GPT генерирует промпт для картинки
  let imagePrompt: string;
  try {
    imagePrompt = await completeChat({
      messages: [
        {
          role: "system",
          content: `You create image generation prompts for character avatars. Given a character description, output a concise visual prompt (max 100 words) for generating a portrait/avatar. Focus on: appearance, clothing, mood, art style. Do NOT include text or names in the image. Output ONLY the prompt, no preamble. Use English.`,
        },
        {
          role: "user",
          content: `Character: "${name}"\nCategory: ${category || "general"}\nDescription: ${description || "not specified"}\nPersonality: ${personality || "not specified"}\n\nGenerate an avatar prompt.`,
        },
      ],
      temperature: 0.9,
      maxTokens: 150,
    });
  } catch (e: any) {
    return NextResponse.json({ error: `LLM: ${e.message}` }, { status: 500 });
  }

  if (!imagePrompt || imagePrompt.length < 10) {
    imagePrompt = `Portrait avatar of a character named ${name}, digital art style, detailed face`;
  }

  // Шаг 2: Генерируем через Pollinations (бесплатно, без ключа)
  const encodedPrompt = encodeURIComponent(imagePrompt.trim());
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${Date.now()}`;

  // Шаг 3: Скачиваем картинку и конвертируем в data URL
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Не удалось сгенерировать изображение" }, { status: 502 });
    }
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ avatarUrl: dataUrl, prompt: imagePrompt });
  } catch (e: any) {
    return NextResponse.json({ error: `Image: ${e.message}` }, { status: 502 });
  }
}
