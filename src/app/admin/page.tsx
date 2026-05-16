"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Shield, Check } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const qc = useQueryClient();
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: () => api.me() });
  const me = meData?.user;

  const { data: usersData } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { credentials: "include" });
      return res.json();
    },
    enabled: me?.role === "admin",
  });

  const [username, setUsername] = React.useState("");
  const [granting, setGranting] = React.useState(false);

  if (!me || me.role !== "admin") {
    return (
      <div className="container py-10 text-center text-muted-foreground">
        <Shield className="h-10 w-10 mx-auto mb-4 opacity-30" />
        Доступ только для администраторов.
      </div>
    );
  }

  async function grantPlus() {
    if (!username.trim()) { toast.error("Введи username"); return; }
    setGranting(true);
    try {
      const res = await fetch("/api/admin/grant-plus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`CharacterLab+ выдан @${json.username}`);
      setUsername("");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGranting(false);
    }
  }

  const users = usersData?.users || [];

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <Shield className="h-5 w-5" /> Админ-панель
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" /> Выдать CharacterLab+
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username пользователя"
              onKeyDown={(e) => e.key === "Enter" && grantPlus()}
            />
            <Button onClick={grantPlus} disabled={granting}>
              {granting ? "..." : "Выдать"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Пользователю придёт уведомление от бота CharacterLab.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Пользователи ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((u: any) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <div>
                  <span className="font-medium">@{u.username}</span>
                  <span className="ml-2 text-muted-foreground">{u.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  {u.isPremium && (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                      <Crown className="h-3 w-3 mr-0.5" /> Plus
                    </Badge>
                  )}
                  {u.role === "admin" && (
                    <Badge variant="secondary" className="text-[10px]">admin</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
