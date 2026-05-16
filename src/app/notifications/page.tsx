"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CheckCircle, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function NotificationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { credentials: "include" });
      return res.json();
    },
  });

  const items = data?.items || [];

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <Bell className="h-5 w-5" /> Уведомления
      </h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border bg-muted/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          Пока нет уведомлений.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n: any) => (
            <Card key={n.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {n.fromBot ? <Bot className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{n.title}</span>
                      {n.fromBot && (
                        <Badge variant="secondary" className="text-[10px] gap-0.5">
                          <CheckCircle className="h-2.5 w-2.5 text-primary" /> бот
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                      {n.body}
                    </p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {formatDate(n.createdAt)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
