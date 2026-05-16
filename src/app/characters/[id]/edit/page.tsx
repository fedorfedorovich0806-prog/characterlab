"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, X, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { compressImage } from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";

const CATEGORIES = [
  "general",
  "romance",
  "fantasy",
  "rpg",
  "realism",
  "anime",
  "assistant",
];
const TEMPERAMENTS = [
  "спокойный",
  "весёлый",
  "холодный",
  "агрессивный",
  "мечтательный",
  "саркастичный",
  "вдохновляющий",
];

type Draft = {
  name: string;
  tagline: string;
  description: string;
  avatarUrl: string | null;
  kind: "character" | "scenario";
  personality: string;
  temperament: string;
  systemPrompt: string;
  memory: string;
  knowledge: string;
  greeting: string;
  exampleDialog: string;
  tags: string;
  category: string;
  isPublic: boolean;
};

export default function EditCharacterPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const knowledgeRef = React.useRef<HTMLInputElement>(null);
  const [d, setD] = React.useState<Draft | null>(null);
  const [busy, setBusy] = React.useState(false);

  const { data } = useQuery({
    queryKey: ["character", params.id],
    queryFn: () => api.getCharacter(params.id),
  });

  React.useEffect(() => {
    if (data?.character && !d) {
      const c = data.character;
      setD({
        name: c.name || "",
        tagline: c.tagline || "",
        description: c.description || "",
        avatarUrl: c.avatarUrl || null,
        kind: c.kind || "character",
        personality: c.personality || "",
        temperament: c.temperament || "",
        systemPrompt: c.systemPrompt || "",
        memory: c.memory || "",
        knowledge: c.knowledge || "",
        greeting: c.greeting || "",
        exampleDialog: c.exampleDialog || "",
        tags: c.tags || "",
        category: c.category || "general",
        isPublic: c.isPublic ?? true,
      });
    }
  }, [data, d]);

  if (!d) {
    return (
      <div className="container max-w-3xl py-8">
        <div className="h-48 animate-pulse rounded-xl border bg-muted/40" />
      </div>
    );
  }

  function upd<K extends keyof Draft>(k: K, v: Draft[K]) {
    setD((s) => (s ? { ...s, [k]: v } : s));
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Нужен файл изображения"); return; }
    try {
      const compressed = await compressImage(file, { maxSize: 512, quality: 0.85 });
      upd("avatarUrl", compressed);
    } catch (err: any) { toast.error(err?.message || "Ошибка"); }
    e.target.value = "";
  }

  async function onPickKnowledge(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".txt") && file.type !== "text/plain") { toast.error("Нужен .txt"); return; }
    if (file.size > 500 * 1024) { toast.error("Макс 500 КБ"); return; }
    const text = await file.text();
    upd("knowledge", text);
    toast.success(`Загружено: ${file.name}`);
    e.target.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!d) return;
    if (!d.name || !d.description || !d.personality || !d.systemPrompt || !d.greeting) {
      toast.error("Заполни обязательные поля");
      return;
    }
    setBusy(true);
    try {
      await api.updateCharacter(params.id, d);
      toast.success("Сохранено");
      router.push(`/characters/${params.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="mb-6 text-2xl font-semibold">Редактировать</h1>
      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Основное</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 rounded-2xl">
                {d.avatarUrl ? <AvatarImage src={d.avatarUrl} /> : null}
                <AvatarFallback className="rounded-2xl text-lg">{initials(d.name || "?")}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload className="h-4 w-4" /> Аватар
                  </Button>
                  {d.avatarUrl ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => upd("avatarUrl", null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
                <Input
                  placeholder="URL изображения"
                  value={d.avatarUrl?.startsWith("data:") ? "" : d.avatarUrl || ""}
                  onChange={(e) => upd("avatarUrl", e.target.value || null)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => upd("kind", "character")} className={cn("rounded-full border px-3 py-1 text-sm", d.kind === "character" ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary")}>Персонаж</button>
              <button type="button" onClick={() => upd("kind", "scenario")} className={cn("rounded-full border px-3 py-1 text-sm", d.kind === "scenario" ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary")}>Сценарий / Мир</button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Имя</Label><Input value={d.name} onChange={(e) => upd("name", e.target.value)} required /></div>
              <div className="space-y-2"><Label>Слоган</Label><Input value={d.tagline} onChange={(e) => upd("tagline", e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Описание</Label><Textarea value={d.description} onChange={(e) => upd("description", e.target.value)} required /></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select value={d.category} onValueChange={(v) => upd("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Теги</Label><Input value={d.tags} onChange={(e) => upd("tags", e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Личность</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Характер и стиль речи</Label><Textarea value={d.personality} onChange={(e) => upd("personality", e.target.value)} required /></div>
            <div className="space-y-2">
              <Label>Темперамент</Label>
              <div className="flex flex-wrap gap-2">
                {TEMPERAMENTS.map((t) => (
                  <button key={t} type="button" onClick={() => upd("temperament", t)} className={cn("rounded-full border px-3 py-1 text-sm", d.temperament === t ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary")}>{t}</button>
                ))}
              </div>
              <Input value={d.temperament} onChange={(e) => upd("temperament", e.target.value)} placeholder="Свой вариант" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Поведение</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>System prompt</Label><Textarea value={d.systemPrompt} onChange={(e) => upd("systemPrompt", e.target.value)} className="min-h-[120px]" required /></div>
            <div className="space-y-2"><Label>Память</Label><Textarea value={d.memory} onChange={(e) => upd("memory", e.target.value)} /></div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><FileText className="h-4 w-4" /> База знаний</Label>
              <p className="text-xs text-muted-foreground">Загрузи .txt с лором. Персонаж будет опираться на это.</p>
              <input ref={knowledgeRef} type="file" accept=".txt,text/plain" className="hidden" onChange={onPickKnowledge} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => knowledgeRef.current?.click()}><Upload className="h-4 w-4" /> .txt</Button>
                {d.knowledge ? <Button type="button" variant="ghost" size="sm" onClick={() => upd("knowledge", "")}><X className="h-4 w-4" /></Button> : null}
              </div>
              {d.knowledge ? <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap">{d.knowledge.slice(0, 2000)}{d.knowledge.length > 2000 ? "..." : ""}</div> : null}
              <Textarea value={d.knowledge} onChange={(e) => upd("knowledge", e.target.value)} placeholder="Или впиши вручную..." className="min-h-[60px]" />
            </div>
            <div className="space-y-2"><Label>Приветствие</Label><Textarea value={d.greeting} onChange={(e) => upd("greeting", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Пример диалога</Label><Textarea value={d.exampleDialog} onChange={(e) => upd("exampleDialog", e.target.value)} /></div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between rounded-xl border p-4">
          <div>
            <div className="font-medium">Публичный</div>
            <div className="text-sm text-muted-foreground">Виден в библиотеке</div>
          </div>
          <Switch checked={d.isPublic} onCheckedChange={(v) => upd("isPublic", v)} />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Отмена</Button>
          <Button type="submit" disabled={busy}>{busy ? "Сохраняем..." : "Сохранить"}</Button>
        </div>
      </form>
    </div>
  );
}
