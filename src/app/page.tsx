"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Sparkles, Flame, Clock, Plus, Star, ArrowRight } from "lucide-react";
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
    <div className="container py-6 md:py-10">
      {/* Hero */}
      <section className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/[0.08] via-background to-accent/50 border">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative flex flex-col items-start justify-between gap-8 p-7 md:p-12 md:flex-row md:items-center">
          <div className="max-w-lg">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> CharacterLab
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-[2.75rem] md:leading-[1.15]">
              Создавай персонажей.
              <br />
              <span className="text-gradient">Погружайся в истории.</span>
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-md">
              Настраивай характер, память и стиль речи. Общайся в реальном времени.
              Делись с друзьями.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full shadow-md shadow-primary/20">
                <Link href="/characters/new">
                  <Plus className="h-4 w-4" /> Создать
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="rounded-full">
                <Link href="/plus">
                  Узнать про Plus <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          {/* Декор */}
          <div className="hidden lg:grid grid-cols-2 gap-3">
            {["general", "rpg", "romance", "fantasy"].map((cat) => (
              <div
                key={cat}
                className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background/80 border shadow-sm"
              >
                <CategoryIcon category={cat} className="h-7 w-7 text-primary/70" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Поиск */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск персонажей..."
            className="pl-10 h-11 rounded-xl border-0 bg-secondary focus-visible:ring-1"
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
      <div className="mb-7 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition shrink-0",
              category === c.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
          >
            <CategoryIcon category={c.id} className="h-3.5 w-3.5" /> {c.label}
          </button>
        ))}
      </div>

      {/* Сетка */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-14 text-center">
          <CategoryIcon category="general" className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium">Персонажей пока нет</p>
          <p className="text-sm text-muted-foreground mt-1">Создай первого и начни общение</p>
          <Button asChild size="lg" className="mt-5 rounded-full">
            <Link href="/characters/new">
              <Plus className="h-4 w-4" /> Создать персонажа
            </Link>
          </Button>
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
