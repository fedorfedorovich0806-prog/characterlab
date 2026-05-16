"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      await api.register({
        email: String(fd.get("email") || ""),
        username: String(fd.get("username") || ""),
        password: String(fd.get("password") || ""),
      });
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Добро пожаловать!");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Создать аккаунт</h1>
          <p className="text-sm text-muted-foreground mt-1">Присоединяйся к CharacterLab</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя</Label>
                <Input id="username" name="username" required minLength={3} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input id="password" name="password" type="password" required minLength={6} className="h-11" />
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl" disabled={loading}>
                {loading ? "Создаём..." : "Создать аккаунт"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
          <p>
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Войти
            </Link>
          </p>
          <p>
            Регистрируясь, ты соглашаешься с{" "}
            <Link href="/rules" className="text-primary hover:underline">
              правилами
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
