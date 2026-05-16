"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, MessageCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";

export default function ChatsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: () => api.listChats(),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.deleteChat(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chats"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const items = data?.items || [];

  return (
    <div className="container max-w-3xl py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Мои чаты</h1>
        <span className="text-sm text-muted-foreground">{items.length} диалогов</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-secondary/40"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-12 text-center">
          <MessageCircle className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground text-lg">Пока пусто</p>
          <p className="text-sm text-muted-foreground mt-1">Открой персонажа и начни диалог</p>
          <div className="mt-5">
            <Button asChild className="rounded-full">
              <Link href="/">
                <Sparkles className="h-4 w-4" /> К персонажам
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((chat: any) => {
            const last = chat.messages?.[0];
            return (
              <div
                key={chat.id}
                className="group flex items-center gap-3 rounded-2xl border bg-card p-3.5 transition hover:shadow-md hover:border-primary/20 w-full"
              >
                <Link
                  href={`/chats/${chat.id}`}
                  className="flex flex-1 items-center gap-3 min-w-0"
                >
                  <Avatar className="h-12 w-12 rounded-xl shadow-sm">
                    {chat.character.avatarUrl ? (
                      <AvatarImage src={chat.character.avatarUrl} />
                    ) : null}
                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                      {initials(chat.character.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate font-semibold text-sm">
                        {chat.character.name}
                      </div>
                      <MessageCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>
                    <div className="truncate text-sm text-muted-foreground mt-0.5">
                      {last ? last.content : "Новый чат"}
                    </div>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition shrink-0 h-8 w-8"
                  onClick={() => {
                    if (confirm("Удалить чат?")) del.mutate(chat.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
