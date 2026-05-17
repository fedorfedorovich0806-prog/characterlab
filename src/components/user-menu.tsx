"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { toast } from "sonner";
import { LogIn, Crown, Shield } from "lucide-react";

export function UserMenu() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
  });
  const user = data?.user;

  if (!user) {
    return (
      <Button asChild size="sm" variant="outline">
        <Link href="/login">
          <LogIn className="h-4 w-4" />
          Войти
        </Link>
      </Button>
    );
  }

  async function logout() {
    try {
      await api.logout();
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Вы вышли");
      router.push("/");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 rounded-full px-2">
          <Avatar className="h-7 w-7">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.username} /> : null}
            <AvatarFallback>{initials(user.username || user.email)}</AvatarFallback>
          </Avatar>
          <span className="ml-2 text-sm">{user.username}</span>
          {user.isPremium && <Crown className="h-3 w-3 ml-1 text-primary" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          Профиль
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/persona")}>
          Персона
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/characters/new")}>
          Создать персонажа
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/?tab=mine")}>
          Мои персонажи
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/chats")}>Мои чаты</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/notifications")}>
          Уведомления
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/achievements")}>
          Достижения
        </DropdownMenuItem>
        {!user.isPremium && (
          <DropdownMenuItem onClick={() => router.push("/plus")}>
            <Crown className="h-3.5 w-3.5 mr-1 text-primary" /> CharacterLab+
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {user.role === "admin" && (
          <DropdownMenuItem onClick={() => router.push("/admin")}>
            <Shield className="h-3.5 w-3.5 mr-1" /> Админ-панель
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => router.push("/rules")}>
          Правила
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/report")} className="text-destructive">
          Пожаловаться
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>Выйти</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
