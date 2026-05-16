import { NextResponse } from "next/server";
import { z } from "zod";
import { completeChat } from "@/lib/groq";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  idea: z.string().min(2).max(2000),
  kind: z.enum(["character", "scenario"]).default("character"),
  name: z.string().max(200).optional(),
  current: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      personality: z.string().optional(),
      temperament: z.string().optional(),
      systemPrompt: z.string().optional(),
      memory: z.string().optional(),
      knowledge: z.string().optional(),
      greeting: z.string().optional(),
      exampleDialog: z.string().optional(),
      tags: z.string().optional(),
      category: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Bad data" },
      { status: 400 },
    );
  }
  const { idea, kind, name, current } = parsed.data;

  const commonRules = `
- "tags" is comma-separated lowercase words (no #).
- "exampleDialog" is 2-3 short exchanges (User:/Character:) showcasing tone.
- Actions and narration are wrapped in *asterisks*, e.g. *заполняет бланк и молча подвигает его ближе*. Spoken words stay in plain text.
- "greeting" is the opening message the user sees, in character/in-world, in the user's language.
- Write in the same language as the user's idea. Keep content tasteful and SFW unless explicitly asked.
- Return ONLY JSON, no prose, no markdown fences.`;

  const sysCharacter = `You design a single roleplay CHARACTER profile for a chat app.
Respond in STRICT JSON:
{
  "name": string,
  "tagline": string,
  "description": string,
  "personality": string,
  "temperament": string,
  "systemPrompt": string,
  "memory": string,
  "greeting": string,
  "exampleDialog": string,
  "category": "romance"|"fantasy"|"rpg"|"realism"|"anime"|"assistant"|"general",
  "tags": string
}
- "systemPrompt" describes who the character is, how they behave, limits, quirks, goals (2nd person, rich).
${commonRules}`;

  const sysScenario = `You design an interactive SCENARIO/WORLD (not one person).
The AI will narrate the whole setting and voice multiple NPCs; the user participates inside the world.
Respond in STRICT JSON with SAME keys as a character plus act as a world:
{
  "name": string,              // название мира/сценария, напр. "Школа №47"
  "tagline": string,
  "description": string,        // описание сеттинга
  "personality": string,        // общий тон и стиль повествования
  "temperament": string,        // атмосфера: уютная, мрачная, комичная и т.д.
  "systemPrompt": string,       // подробный лор: кто где живёт/учится, ключевые NPC (имена, роли, черты), правила мира, возможные события
  "memory": string,             // факты о пользователе которые мир запоминает
  "greeting": string,           // открывающая сцена: *описание* + первая реплика NPC
  "exampleDialog": string,      // 2-3 обмена где видно смену NPC и действия в *звёздочках*
  "category": "romance"|"fantasy"|"rpg"|"realism"|"anime"|"assistant"|"general",
  "tags": string
}
- В systemPrompt обязательно перечисли ключевых NPC (имя, роль, 1-2 черты).
${commonRules}`;

  const sys = kind === "scenario" ? sysScenario : sysCharacter;

  const userMsg = `Idea: ${idea}${name ? `\nSuggested name: ${name}` : ""}${
    current ? `\nCurrent draft:\n${JSON.stringify(current, null, 2)}` : ""
  }`;

  let raw = "";
  try {
    raw = await completeChat({
      messages: [
        { role: "system", content: sys },
        { role: "user", content: userMsg },
      ],
      temperature: 0.9,
      maxTokens: 1200,
    });
  } catch (e: any) {
    const status = e?.status || 500;
    const msg =
      status === 403
        ? "Провайдер LLM отклонил запрос (403). Проверь ключ или регион."
        : status === 401
          ? "Неверный LLM_API_KEY (401). Проверь ключ в .env"
          : status === 429
            ? "Превышен лимит LLM (429). Подожди и попробуй снова."
            : `Ошибка LLM: ${e?.message || "unknown"}`;
    return NextResponse.json({ error: msg }, { status });
  }

  let result: any = null;
  try {
    const cleaned = raw
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
    result = JSON.parse(slice);
  } catch {
    return NextResponse.json(
      { error: "AI вернул неструктурированный ответ, попробуй ещё раз" },
      { status: 502 },
    );
  }

  return NextResponse.json({ result });
}
