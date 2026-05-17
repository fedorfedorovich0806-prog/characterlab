"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles, Save, Crown, Palette, Upload, X, User,
  MessageCircle, Heart, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { compressImage } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterCard } from "@/components/character-card";
import { cn, initials, formatDate } from "@/lib/utils";

export default function ProfilePage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => api.me() });
  const user = data?.user;

  const { data: charsData } = useQuery({
    queryKey: ["characters", "", "", "trending", true],
    queryFn: () => api.listCharacters({ mine: true }),
    enabled: !!user,
  });

  const [persona, setPersona] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [activeTitle, setActiveTitle] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [improving, setImproving] = React.useState(false);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const loaded = React.useRef(false);

  React.useEffect(() => {
    if (user && !loaded.current) {
      setPersona(user.persona || "");
      setUsername(user.username || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatarUrl || null);
      setActiveTitle(user.activeTitle || null);
      loaded.current = true;
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container max-w-2xl py-10 text-center text-muted-foreground">
        Нужно войти в аккаунт.
      </div>
    );
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Нужно изображение"); return; }
    try {
      const compressed = await compressImage(file, { maxSize: 256, quality: 0.85 });
      setAvatarUrl(compressed);
    } catch (err: any) { toast.error(err?.message || "Ошибка"); }
    e.target.value = "";
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, avatarUrl, bio, activeTitle }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Профиль обновлён");
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePersona() {
    setBusy(true);
    try {
      await fetch("/api/auth/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ persona }),
      });
      toast.success("Персона сохранена");
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function improvePersona() {
    if (!persona.trim()) { toast.error("Сначала напиши хоть что-то"); return; }
    setImproving(true);
    try {
      const res = await fetch("/api/auth/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ persona, improve: true }),
      });
      const json = await res.json();
      if (json.persona) { setPersona(json.persona); toast.success("Улучшено!"); }
      else toast.error(json.error || "Ошибка");
    } catch (e: any) { toast.error(e.message); }
    finally { setImproving(false); }
  }

  const myChars = charsData?.items || [];

  return (
    <div className="container max-w-3xl py-8">
      {/* Шапка профиля */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 -mt-12">
            <div className="relative">
              <Avatar className="h-24 w-24 rounded-2xl border-4 border-background shadow-lg">
                {avatarUrl ? <AvatarImage src={avatarUrl} /> : null}
                <AvatarFallback className="rounded-2xl text-2xl">
                  {initials(username || "?")}
                </AvatarFallback>
              </Avatar>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickAvatar} />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 min-w-0 pt-2 sm:pt-6">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-semibold">@{user.username}</h1>
                {user.isPremium && (
                  <Badge className="bg-primary/20 text-primary border-primary/30">
                    <Crown className="h-3 w-3 mr-0.5" /> Plus
                  </Badge>
                )}
              </div>
              {user.bio && <p className="mt-1 text-sm text-muted-foreground">{user.bio}</p>}
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {formatDate(user.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> {myChars.length} персонажей
                </span>
              </div>
            </div>
            {!user.isPremium && (
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href="/plus">
                  <Crown className="h-3.5 w-3.5" /> Plus
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Табы */}
      <Tabs defaultValue="settings" className="mt-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="settings">Настройки</TabsTrigger>
          <TabsTrigger value="persona">Персона</TabsTrigger>
          <TabsTrigger value="characters">Мои персонажи</TabsTrigger>
          {user.isPremium && <TabsTrigger value="themes">Темы</TabsTrigger>}
        </TabsList>

        {/* Настройки */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Редактировать профиль</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Имя пользователя</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                />
              </div>
              <div className="space-y-2">
                <Label>О себе (публичное)</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Пару слов о себе..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Аватарка</Label>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4" /> Загрузить
                  </Button>
                  {avatarUrl && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setAvatarUrl(null)}>
                      <X className="h-4 w-4" /> Убрать
                    </Button>
                  )}
                </div>
              </div>
              <Separator />
              {/* Выбор титула */}
              {user.titles && user.titles.length > 0 && (
                <div className="space-y-2">
                  <Label>Активный титул</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveTitle(null)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition",
                        !activeTitle ? "border-foreground bg-secondary" : "border-border hover:bg-secondary",
                      )}
                    >
                      Без титула
                    </button>
                    {user.titles.map((t: any) => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTitle(t.name)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition",
                          activeTitle === t.name ? "border-foreground bg-secondary" : "border-border hover:bg-secondary",
                        )}
                      >
                        <span className={`title-badge title-${t.color}`}>{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Separator />
              <Button onClick={saveProfile} disabled={savingProfile}>
                <Save className="h-4 w-4" /> {savingProfile ? "Сохраняем..." : "Сохранить профиль"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Персона */}
        <TabsContent value="persona">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Персона</CardTitle>
              <p className="text-sm text-muted-foreground">
                Опиши себя. Персонажи будут опираться на это, когда общаются с тобой.
                Это приватное — другие пользователи не видят.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="Например: Меня зовут Артём, мне 19, учусь на программиста. Люблю аниме и рок. Общаюсь неформально."
                className="min-h-[140px]"
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={savePersona} disabled={busy}>
                  <Save className="h-4 w-4" /> {busy ? "..." : "Сохранить"}
                </Button>
                <Button variant="outline" onClick={improvePersona} disabled={improving}>
                  <Sparkles className="h-4 w-4" /> {improving ? "..." : "Улучшить с AI"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Мои персонажи */}
        <TabsContent value="characters">
          {myChars.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
              У тебя пока нет персонажей.
              <div className="mt-4">
                <Button asChild>
                  <Link href="/characters/new">Создать первого</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myChars.map((c: any) => (
                <CharacterCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Темы */}
        {user.isPremium && (
          <TabsContent value="themes">
            <ThemePicker />
          </TabsContent>
        )}
      </Tabs>

      <div className="mt-6 text-center">
        <Link href="/rules" className="text-sm text-muted-foreground hover:text-foreground">
          Правила приложения
        </Link>
      </div>
    </div>
  );
}

const THEMES = [
  { id: "", label: "По умолчанию", primary: "221 83% 53%" },
  { id: "emerald", label: "Изумруд", primary: "160 84% 39%" },
  { id: "violet", label: "Фиолет", primary: "263 70% 58%" },
  { id: "rose", label: "Роза", primary: "346 77% 50%" },
  { id: "amber", label: "Янтарь", primary: "38 92% 50%" },
  { id: "cyan", label: "Циан", primary: "192 91% 36%" },
  { id: "pink", label: "Розовый", primary: "330 81% 60%" },
  { id: "lime", label: "Лайм", primary: "85 78% 40%" },
];

function ThemePicker() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => api.me() });
  const current = data?.user?.theme || "";

  async function pick(themeId: string) {
    try {
      await fetch("/api/auth/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ theme: themeId }),
      });
      const t = THEMES.find((t) => t.id === themeId) || THEMES[0];
      document.documentElement.style.setProperty("--primary", t.primary);
      document.documentElement.style.setProperty("--ring", t.primary);
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Тема применена");
    } catch {}
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4" /> Тема оформления
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Выбери акцентный цвет. Применяется ко всему интерфейсу.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition hover:border-foreground/30",
                current === t.id && "border-foreground ring-2 ring-foreground/20",
              )}
            >
              <div
                className="h-8 w-8 rounded-full shadow-sm"
                style={{ background: `hsl(${t.primary})` }}
              />
              <span className="text-[10px] leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
