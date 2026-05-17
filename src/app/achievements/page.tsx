"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TitleBadge } from "@/components/title-badge";

export default function AchievementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await fetch("/api/achievements", { credentials: "include" });
      return res.json();
    },
  });

  const all = data?.all || [];

  return (
    <div className="container max-w-3xl py-8">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Достижения</h1>
          <p className="text-sm text-muted-foreground">
            Получай за активность. Некоторые дают титулы.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {all.map((a: any) => (
            <Card
              key={a.key}
              className={cn(
                "transition",
                a.earned
                  ? "border-primary/20 bg-primary/[0.03]"
                  : "opacity-60",
              )}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold",
                    a.earned
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {a.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{a.name}</span>
                    {a.earned && (
                      <span className="text-[10px] text-primary font-medium bg-primary/10 rounded px-1.5 py-0.5">
                        Получено
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.description}
                  </p>
                  {a.titleReward && (
                    <div className="mt-1.5">
                      <span className="text-[10px] text-muted-foreground mr-1">Награда:</span>
                      <TitleBadge name={a.titleReward.name} color={a.titleReward.color} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
