"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Sparkles, TrendingUp, Clock, Plus, Flame, Star } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CharacterCard } from "@/components/character-card";
import { CategoryIcon } from "@/components/category-icons";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "", label: "Все" },
  { id: "romance", label: "Романтика" },
  { id: "fantasy", label: "Фэнтези" },
  { id: "rpg", label: "RPG" },
  { id: "realism", label: "Реализм" },
  { id: "anime", label: "Аниме" },
  { id: "assistant", label: "Помощники" },
  { id: "general", label: "Другое" },
];

export default function HomePage() {
  const [q, setQ] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [sort, setSort] = React.useState<"trending" | "new">("trending");
  const [mine, setMine] = React.useState(false);

  const debouncedQ = useDebounce(q, 250);

  const { data, isLoading } = useQuery({
    queryKey: ["characters", debouncedQ, category, sort, mine],
    queryFn: () =>
      api.listCharacters({
        q: debouncedQ,
        category: category || undefined,
        sort,
        mine,
      }),
  });

  const items = data?.items || [];

  return (
    <div className="container py-6 md:py-8">
      {/* Hero баннер */}
      <section className="relative mb-8 overflow-hidden rounded-3xl border shadow-sm">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80"
            alt=""
            className="h-full w-full object-cover opacity-25 dark:opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/60 to-primary/5 dark:from-background/80 dark:via-background/50 dark:to-primary/10" />
        </div>
        <div className="relative flex flex-col items-start justify-between gap-6 p-6 md:p-10 md:flex-row md:items-center">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI Roleplay Platform
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Общайся с AI-персонажами
            </h1>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed">
              Создавай уникальных персонажей, настраивай их характер, память и стиль.
              Погружайся в ролевые сценарии и миры.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full shadow-md">
                <Link href="/characters/new">
                  <Plus className="h-4 w-4" /> Создать персонажа
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full">
                <Link href="/plus">
                  <Star className="h-4 w-4" /> CharacterLab+
                </Link>
              </Button>
            </div>
          </div>
          {/* Декоративные элементы */}
          <div className="hidden lg:flex flex-col gap-3 opacity-80">
            <div className="flex gap-2">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 backdrop-blur flex items-center justify-center">
                <CategoryIcon category="general" className="h-7 w-7 text-primary" />
              </div>
              <div className="h-16 w-16 rounded-2xl bg-primary/10 backdrop-blur flex items-center justify-center">
                <CategoryIcon category="rpg" className="h-7 w-7 text-primary/70" />
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/15 backdrop-blur flex items-center justify-center">
                <CategoryIcon category="romance" className="h-7 w-7 text-primary/80" />
              </div>
              <div className="h-16 w-16 rounded-2xl bg-primary/10 backdrop-blur flex items-center justify-center">
                <CategoryIcon category="fantasy" className="h-7 w-7 text-primary/60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Поиск и фильтры */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Найти персонажа..."
            className="pl-10 h-11 rounded-xl bg-secondary border-0 focus-visible:ring-1"
          />
        </div>
        <div className="flex items-center gap-1 rounded-xl bg-secondary p-1">
          <button
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition",
              sort === "trending"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setSort("trending")}
          >
            <Flame className="h-3.5 w-3.5" /> Тренды
          </button>
          <button
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition",
              sort === "new"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setSort("new")}
          >
            <Clock className="h-3.5 w-3.5" /> Новые
          </button>
        </div>
        <button
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-medium transition",
            mine
              ? "bg-primary/10 text-primary border border-primary/30"
              : "bg-secondary text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setMine((v) => !v)}
        >
          Мои
        </button>
      </div>

      {/* Категории */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition shrink-0",
              category === c.id
                ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                : "border-transparent bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
            )}
          >
            <CategoryIcon category={c.id} className="h-3.5 w-3.5" /> {c.label}
          </button>
        ))}
      </div>

      {/* Сетка персонажей */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl bg-secondary"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-12 text-center">
          <div className="flex justify-center mb-4">
            <CategoryIcon category="general" className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground text-lg">Персонажей пока нет</p>
          <p className="text-sm text-muted-foreground mt-1">Создай первого и начни общение</p>
          <div className="mt-5">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/characters/new">
                <Plus className="h-4 w-4" /> Создать персонажа
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c: any) => (
            <CharacterCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
