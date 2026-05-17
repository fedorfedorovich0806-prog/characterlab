"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown, Shield, Award, Flag, Check, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TitleBadge } from "@/components/title-badge";

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

  const { data: reportsData } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports?status=open", { credentials: "include" });
      return res.json();
    },
    enabled: me?.role === "admin",
  });

  const [plusUsername, setPlusUsername] = React.useState("");
  const [titleUsername, setTitleUsername] = React.useState("");
  const [titleName, setTitleName] = React.useState("");
  const [titleColor, setTitleColor] = React.useState("gold");
  const [granting, setGranting] = React.useState(false);
  const [grantingTitle, setGrantingTitle] = React.useState(false);

  if (!me || me.role !== "admin") {
    return (
      <div className="container py-10 text-center text-muted-foreground">
        <Shield className="h-10 w-10 mx-auto mb-4 opacity-30" />
        Доступ только для администраторов.
      </div>
    );
  }

  async function grantPlus() {
    if (!plusUsername.trim()) { toast.error("Введи username"); return; }
    setGranting(true);
    try {
      const res = await fetch("/api/admin/grant-plus", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ username: plusUsername.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`CharacterLab+ выдан @${json.username}`);
      setPlusUsername("");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setGranting(false); }
  }

  async function grantTitle() {
    if (!titleUsername.trim() || !titleName.trim()) { toast.error("Заполни поля"); return; }
    setGrantingTitle(true);
    try {
      const res = await fetch("/api/admin/titles", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ username: titleUsername.trim(), name: titleName.trim(), color: titleColor }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`Титул "${titleName}" выдан @${titleUsername}`);
      setTitleUsername(""); setTitleName("");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setGrantingTitle(false); }
  }

  async function closeReport(id: string, status: "reviewed" | "closed") {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Ошибка");
      toast.success("Репорт обработан");
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
    } catch (e: any) { toast.error(e.message); }
  }

  const users = usersData?.users || [];
  const reports = reportsData?.reports || [];

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="h-5 w-5" /> Админ-панель
      </h1>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="titles">Титулы</TabsTrigger>
          <TabsTrigger value="reports">Репорты ({reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" /> Выдать CharacterLab+
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input value={plusUsername} onChange={(e) => setPlusUsername(e.target.value)} placeholder="username" onKeyDown={(e) => e.key === "Enter" && grantPlus()} />
              <Button onClick={grantPlus} disabled={granting}>{granting ? "..." : "Выдать"}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Пользователи ({users.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div>
                      <a href={`/users/${u.username}`} className="font-medium hover:text-primary">@{u.username}</a>
                      <span className="ml-2 text-muted-foreground text-xs">{u.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.isPremium && <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]"><Crown className="h-3 w-3 mr-0.5" /> Plus</Badge>}
                      {u.role === "admin" && <Badge variant="secondary" className="text-[10px]">admin</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="titles">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4" /> Выдать титул
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Username</Label>
                  <Input value={titleUsername} onChange={(e) => setTitleUsername(e.target.value)} placeholder="username" />
                </div>
                <div className="space-y-1">
                  <Label>Название титула</Label>
                  <Input value={titleName} onChange={(e) => setTitleName(e.target.value)} placeholder="Администратор, Ветеран..." />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Цвет</Label>
                <div className="flex gap-2">
                  {["gold", "red", "blue", "purple", "green"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setTitleColor(c)}
                      className={`rounded-full border-2 px-3 py-1 text-xs font-medium transition ${titleColor === c ? "border-foreground" : "border-transparent"}`}
                    >
                      <TitleBadge name={c} color={c} />
                    </button>
                  ))}
                </div>
              </div>
              {titleName && (
                <div className="text-sm">Превью: <TitleBadge name={titleName} color={titleColor} /></div>
              )}
              <Button onClick={grantTitle} disabled={grantingTitle}>
                {grantingTitle ? "..." : "Выдать титул"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          {reports.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed p-10 text-center text-muted-foreground">
              Нет открытых репортов.
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((r: any) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm">
                          <Flag className="h-3.5 w-3.5 text-destructive" />
                          <span className="font-medium">{r.targetType}</span>
                          <span className="text-muted-foreground">от @{r.author?.username}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{r.reason}</p>
                        <p className="mt-1 text-xs text-muted-foreground">ID: {r.targetId}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => closeReport(r.id, "reviewed")}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => closeReport(r.id, "closed")}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
