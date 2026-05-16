"use client";

import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CategoryIcon } from "@/components/category-icons";
import { cn, initials } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type CharacterCardData = {
  id: string;
  name: string;
  tagline?: string | null;
  description: string;
  avatarUrl?: string | null;
  category: string;
  tags?: string;
  likesCount: number;
  messagesCount: number;
  author?: { username: string } | null;
  likedByMe?: boolean;
};

export function CharacterCard({ c }: { c: CharacterCardData }) {
  const qc = useQueryClient();
  const like = useMutation({
    mutationFn: () => api.likeCharacter(c.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["characters"] }),
    onError: (e: any) => toast.error(e.message || "Нужен вход"),
  });

  const tags = (c.tags || "").split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="group relative rounded-2xl border bg-card transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 hover:-translate-y-0.5">
      <Link href={`/characters/${c.id}`} className="block p-4 pb-3">
        <div className="flex gap-3.5">
          <Avatar className="h-12 w-12 rounded-xl ring-1 ring-border">
            {c.avatarUrl ? <AvatarImage src={c.avatarUrl} alt={c.name} /> : null}
            <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary text-sm font-semibold">
              {initials(c.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold text-[15px] leading-tight">{c.name}</h3>
              <CategoryIcon category={c.category} className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
            </div>
            {c.tagline && (
              <p className="mt-0.5 line-clamp-1 text-[13px] text-muted-foreground">
                {c.tagline}
              </p>
            )}
            <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground/80 leading-relaxed">
              {c.description}
            </p>
          </div>
        </div>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1 pl-[3.75rem]">
            {tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {t}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[11px] text-muted-foreground/60">+{tags.length - 3}</span>
            )}
          </div>
        )}
      </Link>

      <div className="flex items-center justify-between border-t px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.preventDefault(); like.mutate(); }}
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium transition hover:scale-110 active:scale-95",
              c.likedByMe ? "text-rose-500" : "text-muted-foreground hover:text-rose-500",
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", c.likedByMe && "fill-current")} />
            {c.likesCount}
          </button>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5" />
            {c.messagesCount}
          </span>
        </div>
        {c.author && (
          <a
            href={`/users/${c.author.username}`}
            className="text-xs text-muted-foreground hover:text-primary transition"
            onClick={(e) => e.stopPropagation()}
          >
            @{c.author.username}
          </a>
        )}
      </div>
    </div>
  );
}
