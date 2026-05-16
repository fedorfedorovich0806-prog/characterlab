"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Heart,
  MessageCircle,
  Pencil,
  Trash2,
  User,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn, initials } from "@/lib/utils";

export default function CharacterPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["character", params.id],
    queryFn: () => api.getCharacter(params.id),
  });
  const c = data?.character;

  const like = useMutation({
    mutationFn: () => api.likeCharacter(params.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["character", params.id] }),
    onError: (e: any) => toast.error(e.message || "Нужен вход"),
  });

  const startChat = useMutation({
    mutationFn: () => api.createChat(params.id),
    onSuccess: ({ chat }) => router.push(`/chats/${chat.id}`),
    onError: (e: any) => toast.error(e.message || "Нужен вход"),
  });

  const del = useMutation({
    mutationFn: () => api.deleteCharacter(params.id),
    onSuccess: () => {
      toast.success("Удалено");
      router.push("/");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!c) {
    return (
      <div className="container py-10">
        <div className="h-48 animate-pulse rounded-xl border bg-muted/40" />
      </div>
    );
  }

  const tags = (c.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean);

  return (
    <div className="container max-w-3xl py-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 md:flex-row">
            <Avatar className="h-24 w-24 rounded-2xl">
              {c.avatarUrl ? <AvatarImage src={c.avatarUrl} /> : null}
              <AvatarFallback className="rounded-2xl text-xl">
                {initials(c.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold">{c.name}</h1>
                <Badge variant="muted" className="capitalize">
                  {c.category}
                </Badge>
                {!c.isPublic ? <Badge variant="secondary">приватный</Badge> : null}
              </div>
              {c.tagline ? (
                <p className="mt-1 text-muted-foreground">{c.tagline}</p>
              ) : null}
              <p className="mt-3 whitespace-pre-wrap text-sm">{c.description}</p>

              {tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {tags.map((t: string) => (
                    <Badge key={t} variant="secondary" className="text-[11px]">
                      #{t}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> @{c.author?.username}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> {c.messagesCount}
                </span>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => startChat.mutate()} disabled={startChat.isPending}>
              <Send className="h-4 w-4" />
              {startChat.isPending ? "Открываем..." : "Начать чат"}
            </Button>
            <Button
              variant="outline"
              onClick={() => like.mutate()}
              className={cn(c.likedByMe && "text-primary")}
            >
              <Heart className={cn("h-4 w-4", c.likedByMe && "fill-current")} />
              {c.likesCount}
            </Button>
            {c.isMine ? (
              <>
                <Button asChild variant="ghost">
                  <Link href={`/characters/${c.id}/edit`}>
                    <Pencil className="h-4 w-4" /> Редактировать
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("Удалить персонажа?")) del.mutate();
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Удалить
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {c.greeting ? (
        <Card className="mt-4">
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Приветствие
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{c.greeting}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
