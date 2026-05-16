"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Crown, X } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const FEATURES = [
  { name: "Основные модели чата", free: true, plus: true },
  { name: "Умная модель (GPT-5.5)", free: false, plus: true },
  { name: "Расширенная память", free: false, plus: true },
  { name: "Кастомные темы оформления", free: false, plus: true },
  { name: "Приоритетная генерация", free: false, plus: true },
  { name: "Без ограничений сообщений", free: false, plus: true },
  { name: "Улучшенная персона (AI)", free: false, plus: true },
  { name: "Ранний доступ к новым фичам", free: false, plus: true },
];

export default function PlusPage() {
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => api.me() });
  const user = data?.user;
  const [showInstructions, setShowInstructions] = React.useState(false);

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)]">
      {/* Фон на всю страницу */}
      <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <img
          src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1400&q=80"
          alt=""
          className="h-full w-full object-cover"
          style={{ opacity: 0.45 }}
        />
        <div className="absolute inset-0 bg-background/50 dark:bg-background/70" />
      </div>

      {/* Hero */}
      <div className="relative" style={{ zIndex: 1 }}>
        <div className="container py-16 text-center">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 text-sm px-4 py-1">
            <Crown className="h-3.5 w-3.5 mr-1" /> CharacterLab+
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Обновление до CharacterLab+
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
            Разблокируй умную модель, кастомные темы и расширенные возможности.
          </p>
        </div>
      </div>

      <div className="relative container max-w-4xl py-10" style={{ zIndex: 1 }}>
        <div className="grid gap-8 md:grid-cols-2">
          {/* Таблица фич */}
          <Card>
            <CardContent className="p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 text-left font-medium">Функция</th>
                    <th className="pb-3 text-center font-medium">Бесплатно</th>
                    <th className="pb-3 text-center font-medium text-primary">Plus</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((f) => (
                    <tr key={f.name} className="border-b last:border-0">
                      <td className="py-3">{f.name}</td>
                      <td className="py-3 text-center">
                        {f.free ? (
                          <Check className="h-4 w-4 mx-auto text-green-500" />
                        ) : (
                          <X className="h-4 w-4 mx-auto text-muted-foreground/40" />
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <Check className="h-4 w-4 mx-auto text-primary" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Цена */}
          <div className="space-y-4">
            <Card className="border-primary/30">
              <CardContent className="p-6 text-center">
                <div className="text-sm text-muted-foreground mb-2">Навсегда</div>
                <div className="text-4xl font-bold">300₽</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Одноразовый платёж, без подписки
                </div>
                {user?.isPremium ? (
                  <div className="mt-6 rounded-lg bg-primary/10 p-3 text-primary font-medium">
                    <Crown className="h-4 w-4 inline mr-1" /> У тебя уже есть CharacterLab+
                  </div>
                ) : (
                  <Button
                    className="mt-6 w-full"
                    size="lg"
                    onClick={() => setShowInstructions(true)}
                  >
                    <Crown className="h-4 w-4" /> Подписаться
                  </Button>
                )}
              </CardContent>
            </Card>

            {user?.isPremium && (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  Ты можешь переключить модель на GPT-5.5 прямо в чате.
                  Также доступны кастомные темы в настройках профиля.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Инструкция оплаты */}
        {showInstructions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <Card className="w-full max-w-md animate-fade-in">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" /> Инструкция оплаты
                  </h2>
                  <button onClick={() => setShowInstructions(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                    <span>Переведи <strong>300₽</strong> на карту:</span>
                  </li>
                  <li className="ml-9">
                    <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                      2200 7005 2671 8126
                    </code>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                    <span>
                      В комментарии к переводу напиши:<br />
                      <code className="rounded bg-muted px-2 py-1 text-xs">
                        CharacterLab+ на {user?.username || "твой_ник"}
                      </code>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
                    <span>Подожди до 24 часов. Подписка будет активирована администратором, и тебе придёт уведомление.</span>
                  </li>
                </ol>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
                  <strong>Примечание:</strong> Это не обман. Мы гарантируем активацию подписки после получения оплаты. На данный момент у нас нет возможности подключить официальную платёжную систему, поэтому оплата производится переводом на карту. Если возникнут вопросы — пиши в поддержку.
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowInstructions(false)}
                >
                  Понятно, закрыть
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
