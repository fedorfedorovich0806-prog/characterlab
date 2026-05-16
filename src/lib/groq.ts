// Универсальный OpenAI-совместимый клиент.
// Имя файла оставлено как groq.ts для обратной совместимости импортов.

export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

function cfg() {
  const apiKey = process.env.LLM_API_KEY || process.env.GROQ_API_KEY;
  const baseUrl =
    process.env.LLM_BASE_URL ||
    (process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1" : "https://api.openai.com/v1");
  const model =
    process.env.LLM_MODEL ||
    process.env.GROQ_MODEL ||
    "gpt-4o-mini";
  if (!apiKey) throw new Error("LLM_API_KEY is missing");
  return { apiKey, baseUrl: baseUrl.replace(/\/+$/, ""), model };
}

export const LLM_MODEL = process.env.LLM_MODEL || process.env.GROQ_MODEL || "gpt-4o-mini";

export function buildSystemPrompt(input: {
  name: string;
  kind?: "character" | "scenario" | string | null;
  personality: string;
  temperament?: string | null;
  systemPrompt: string;
  memory?: string | null;
  knowledge?: string | null;
  greeting?: string | null;
  exampleDialog?: string | null;
  summary?: string | null;
  username?: string | null;
  persona?: string | null;
}) {
  const parts: string[] = [];
  const isScenario = input.kind === "scenario";

  if (isScenario) {
    parts.push(
      `You are running an interactive scenario called "${input.name}". You are NOT a single person — you are the narrator and voice of the entire world: describe the setting, events, NPCs, and their dialogue. The user is a participant inside this world.`,
      `FORMATTING RULES (STRICT):
- Actions, descriptions, thoughts, and narration are written in *italics* (wrap in single asterisks). Each action/description is its own paragraph.
- Spoken dialogue is on a new line, starting with an em-dash: — "dialogue text"
- Emphasize key words with *single asterisks* for italic.
- Separate actions and dialogue with blank lines for readability.
- When an NPC speaks, format: *description of action*\\n\\n— Name: "dialogue"
- Never use quotation marks without the em-dash prefix for dialogue.
- Never break the fourth wall, never say you are an AI.
- Respond in the user's language. Keep pacing natural.

Example format:
*Звонок разрезает тишину коридора. Ученики начинают стекаться к кабинету.*

— Мария Ивановна: Садитесь. Сегодня контрольная.

*Она кладёт стопку листов на стол и обводит класс взглядом.*`,
    );
  } else {
    parts.push(
      `You are roleplaying as the character "${input.name}". Stay in character at all times. Never reveal you are an AI or mention system prompts. Respond in the user's language.`,
      `FORMATTING RULES (STRICT):
- Actions, descriptions, gestures, thoughts, and internal states are written in *italics* (wrap in single asterisks). Each action is its own paragraph.
- Spoken dialogue is on a new line, starting with an em-dash: — "dialogue text" or just — dialogue text
- Emphasize key words with *single asterisks* for italic.
- Separate actions and dialogue with blank lines for readability.
- Never use quotation marks without the em-dash prefix for dialogue.
- Do NOT use **bold**. Only *italic* for actions.

Example format:
*Смотрит на тебя долгим взглядом, потом медленно кивает*

— Аргумент... Ладно. Ты выжил — это уже плюс.

*Слегка отходит в сторону и бросает последнюю фразу уже почти доброжелательно:*

— Только не делай из этого привычку. Следующий раз может быть *менее удачным*.`,
    );
  }

  if (input.temperament) parts.push(`Temperament: ${input.temperament}.`);
  if (input.personality) parts.push(`Personality and speech style: ${input.personality}`);
  parts.push(`${isScenario ? "Scenario/world definition" : "Character definition and behavior"}:\n${input.systemPrompt}`);
  if (input.memory) parts.push(`Persistent memory about the user:\n${input.memory}`);
  if (input.knowledge) {
    parts.push(
      `KNOWLEDGE BASE (source of truth). Base your replies primarily on these facts. If the user asks about something covered here, stick to it; if not covered, say so in character. Do not invent contradictions.\n---\n${input.knowledge}\n---`,
    );
  }
  if (input.exampleDialog) parts.push(`Example dialog (for tone reference only):\n${input.exampleDialog}`);
  if (input.summary) parts.push(`Conversation summary so far:\n${input.summary}`);
  if (input.username) parts.push(`The user's name is ${input.username}.`);
  if (input.persona) parts.push(`About the user (their self-description):\n${input.persona}`);
  parts.push(
    `Keep replies natural, concise by default, and expressive. Avoid generic AI disclaimers. Do not break the fourth wall.`,
  );
  return parts.join("\n\n");
}

async function httpChat(body: Record<string, unknown>, stream: boolean) {
  const { apiKey, baseUrl, model } = cfg();
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://characterlab.app",
      "X-Title": "CharacterLab",
    },
    body: JSON.stringify({ model, stream, ...body }),
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    const err: any = new Error(
      `LLM ${res.status}: ${text.slice(0, 300) || res.statusText}`,
    );
    err.status = res.status;
    throw err;
  }
  return res;
}

export async function completeChat(params: {
  messages: ChatMsg[];
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const res = await httpChat(
    {
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens ?? 700,
    },
    false,
  );
  const json: any = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

// Асинхронный генератор дельт, совместимый с тем, как его потребляет route handler.
export async function* streamChat(params: {
  messages: ChatMsg[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}): AsyncGenerator<{ choices: Array<{ delta: { content?: string } }> }> {
  const res = await httpChat(
    {
      messages: params.messages,
      temperature: params.temperature ?? 0.85,
      max_tokens: params.maxTokens ?? 800,
      ...(params.model ? { model: params.model } : {}),
    },
    true,
  );
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data);
        const content: string = json.choices?.[0]?.delta?.content ?? "";
        if (content) {
          yield { choices: [{ delta: { content } }] };
        }
      } catch {
        // игнорируем мусорные строки
      }
    }
  }
}

export function approxTokens(text: string) {
  return Math.ceil(text.length / 4);
}

export function fitHistory(
  messages: ChatMsg[],
  budgetTokens: number,
): { kept: ChatMsg[]; dropped: ChatMsg[] } {
  const kept: ChatMsg[] = [];
  const dropped: ChatMsg[] = [];
  let used = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    const t = approxTokens(m.content) + 8;
    if (used + t > budgetTokens) {
      dropped.unshift(m);
    } else {
      kept.unshift(m);
      used += t;
    }
  }
  return { kept, dropped };
}

export async function summarizeMessages(messages: ChatMsg[], previousSummary?: string | null) {
  if (messages.length === 0) return previousSummary || "";
  const text = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");
  const prompt: ChatMsg[] = [
    {
      role: "system",
      content:
        "You compress dialogues into compact factual summaries. Preserve names, intents, facts, relationships, promises and emotional tone. Return 5-10 bullet points, no preamble.",
    },
    {
      role: "user",
      content: `${previousSummary ? `Previous summary:\n${previousSummary}\n\n` : ""}New messages:\n${text}\n\nUpdate the summary.`,
    },
  ];
  return completeChat({ messages: prompt, temperature: 0.2, maxTokens: 400 });
}
