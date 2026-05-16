"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, Crown, Bell, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => api.me() });
  const user = data?.user;
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Лого */}
        <Link href="/" className="flex items-center gap-2 font-semibold shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline">CharacterLab</span>
        </Link>

        {/* Десктоп навигация */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link href="/" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition">
            Главная
          </Link>
          <Link href="/chats" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition">
            Чаты
          </Link>
          <Link href="/characters/new" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition">
            Создать
          </Link>
          <Link href="/plus" className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition flex items-center gap-1">
            <Crown className="h-3.5 w-3.5" /> Plus
          </Link>
        </nav>

        {/* Правая часть */}
        <div className="flex items-center gap-1">
          {user && (
            <Button asChild variant="ghost" size="icon" className="relative h-9 w-9">
              <Link href="/notifications">
                <Bell className="h-4 w-4" />
                {user.unreadNotifications > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {user.unreadNotifications > 9 ? "9+" : user.unreadNotifications}
                  </span>
                )}
              </Link>
            </Button>
          )}
          <ThemeToggle />
          <div className="hidden md:block">
            <UserMenu />
          </div>
          {/* Мобильный бургер */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Мобильное меню */}
      {open && (
        <div className="border-t bg-background p-4 md:hidden animate-fade-in">
          <nav className="flex flex-col gap-1 text-sm">
            <Link href="/" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-accent">Главная</Link>
            <Link href="/chats" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-accent">Чаты</Link>
            <Link href="/characters/new" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-accent">Создать персонажа</Link>
            <Link href="/plus" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-accent flex items-center gap-1">
              <Crown className="h-3.5 w-3.5" /> CharacterLab+
            </Link>
            <Link href="/profile" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 hover:bg-accent">Профиль</Link>
            <Link href="/rules" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-muted-foreground hover:bg-accent">Правила</Link>
          </nav>
          <div className="mt-3 pt-3 border-t">
            <UserMenu />
          </div>
        </div>
      )}
    </header>
  );
}
