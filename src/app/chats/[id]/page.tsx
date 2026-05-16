"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Send, ArrowLeft, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, initials } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  pending?: boolean;
};

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const chatId = params.id;
  const qc = useQueryClient();

  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: () => api.me() });
  const isPremium = meData?.user?.isPremium;

  const { data } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => api.getChat(chatId),
  });

  const character = data?.chat?.character;

  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const [smartModel, setSmartModel] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Инициализация из server state
  React.useEffect(() => {
    if (data?.messages) setMessages(data.messages as Message[]);
  }, [data?.messages]);

  // Автоскролл вниз
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streaming]);

  async function send(opts: { regenerate?: boolean } = {}) {
    if (streaming) return;
    const { regenerate = false } = opts;
    const content = regenerate ? undefined : input.trim();
    if (!regenerate && !content) return;

    const tempUserId = `tmp-u-${Date.now()}`;
    const tempAssId = `tmp-a-${Date.now()}`;

    setMessages((prev) => {
      let next = [...prev];
      if (regenerate) {
        // Убираем последнее assistant-сообщение
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === "assistant") {
            next.splice(i, 1);
            break;
          }
        }
      } else if (content) {
        next.push({
          id: tempUserId,
          role: "user",
          content,
        });
      }
      next.push({ id: tempAssId, role: "assistant", content: "", pending: true });
      return next;
    });
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          regenerate
            ? { regenerate: true, model: smartModel ? "smart" : undefined }
            : { content, model: smartModel ? "smart" : undefined },
        ),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Ошибка генерации");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssId ? { ...m, content: buf, pending: true } : m,
          ),
        );
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAssId ? { ...m, content: buf, pending: false } : m,
        ),
      );
      // Обновляем список чатов на навигации
      qc.invalidateQueries({ queryKey: ["chats"] });
    } catch (e: any) {
      toast.error(e.message || "Что-то пошло не так");
      setMessages((prev) => prev.filter((m) => m.id !== tempAssId));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 3.5rem)" }}>
      <div className="border-b bg-background/70 backdrop-blur">
        <div className="container flex h-14 items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/chats">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          {character ? (
            <Link
              href={`/characters/${character.id}`}
              className="flex min-w-0 items-center gap-3"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {character.avatarUrl ? (
                  <AvatarImage src={character.avatarUrl} />
                ) : null}
                <AvatarFallback className="rounded-lg">
                  {initials(character.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {character.name}
                </div>
                {character.tagline ? (
                  <div className="truncate text-xs text-muted-foreground">
                    {character.tagline}
                  </div>
                ) : null}
              </div>
            </Link>
          ) : null}
        </div>
      </div>

      <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto">
        <div className="container max-w-3xl py-6">
          <div className="space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} m={m} character={character} />
            ))}
            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Начни диалог.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t bg-background">
        <div className="container max-w-3xl py-3">
          {isPremium && (
            <div className="mb-2 flex items-center gap-2">
              <button
                onClick={() => setSmartModel((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition",
                  smartModel
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                <Zap className="h-3 w-3" />
                {smartModel ? "GPT-5.5 (умная)" : "GPT-5.4"}
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Напиши сообщение..."
              className="min-h-[46px] max-h-40"
              disabled={streaming}
            />
            {streaming ? (
              <Button variant="outline" onClick={stop}>
                Остановить
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={messages.length === 0}
                  onClick={() => send({ regenerate: true })}
                  title="Перегенерировать"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button onClick={() => send()} disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Enter — отправить, Shift+Enter — перенос
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  m,
  character,
}: {
  m: Message;
  character?: { name: string; avatarUrl?: string | null } | null;
}) {
  const isUser = m.role === "user";
  return (
    <div
      className={cn(
        "flex animate-fade-in gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <Avatar className="h-8 w-8 rounded-lg shrink-0">
        {!isUser && character?.avatarUrl ? (
          <AvatarImage src={character.avatarUrl} />
        ) : null}
        <AvatarFallback className="rounded-lg text-xs">
          {isUser ? "Я" : initials(character?.name || "AI")}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-secondary text-secondary-foreground",
        )}
      >
        {m.content ? (
          <FormattedMessage content={m.content} />
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            печатает...
          </div>
        )}
      </div>
    </div>
  );
}

// Рендерит *курсив* и — диалоги
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Строка-диалог (начинается с — или -)
        const isDialogue = /^[—–-]\s/.test(trimmed);

        // Рендерим inline *italic*
        const rendered = renderInlineFormatting(trimmed);

        if (isDialogue) {
          return (
            <p key={i} className="font-medium">
              {rendered}
            </p>
          );
        }

        // Если вся строка обёрнута в * — это действие
        const isFullAction = /^\*[^*]+\*$/.test(trimmed);
        if (isFullAction) {
          return (
            <p key={i} className="italic text-muted-foreground">
              {renderInlineFormatting(trimmed)}
            </p>
          );
        }

        return <p key={i}>{rendered}</p>;
      })}
    </div>
  );
}

function renderInlineFormatting(text: string): React.ReactNode {
  // Разбиваем по *...*
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={i} className="italic not-italic-reset">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
