"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, MessageCircle, Sparkles, ArrowRight } from "lucide-react";
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
        <div>
          <h1 className="text-2xl font-bold">Чаты</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} диалогов</p>
        </div>
        <Button asChild variant="outline" className="rounded-full" size="sm">
          <Link href="/">
            <Sparkles className="h-3.5 w-3.5" /> Найти персонажа
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-14 text-center">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium">Пока пусто</p>
          <p className="text-sm text-muted-foreground mt-1">Открой персонажа и начни диалог</p>
          <Button asChild className="mt-5 rounded-full" size="lg">
            <Link href="/">
              К персонажам <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((chat: any) => {
            const last = chat.messages?.[0];
            return (
              <div
                key={chat.id}
                className="group flex items-center gap-3 rounded-2xl border bg-card p-3.5 transition hover:shadow-md hover:border-primary/15 w-full"
              >
                <Link
                  href={`/chats/${chat.id}`}
                  className="flex flex-1 items-center gap-3 min-w-0"
                >
                  <Avatar className="h-11 w-11 rounded-xl ring-1 ring-border">
                    {chat.character.avatarUrl ? (
                      <AvatarImage src={chat.character.avatarUrl} />
                    ) : null}
                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary text-xs font-semibold">
                      {initials(chat.character.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-sm">
                      {chat.character.name}
                    </div>
                    <div className="truncate text-[13px] text-muted-foreground mt-0.5">
                      {last ? last.content : "Новый чат"}
                    </div>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (confirm("Удалить чат?")) del.mutate(chat.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
