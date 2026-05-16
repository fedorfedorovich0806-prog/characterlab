"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Upload, X, FileText, Wand2 } from "lucide-react";
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

const EMPTY: Draft = {
  name: "",
  tagline: "",
  description: "",
  avatarUrl: null,
  kind: "character",
  personality: "",
  temperament: "",
  systemPrompt: "",
  memory: "",
  knowledge: "",
  greeting: "",
  exampleDialog: "",
  tags: "",
  category: "general",
  isPublic: true,
};

export default function NewCharacterPage() {
  const router = useRouter();
  const [d, setD] = React.useState<Draft>(EMPTY);
  const [idea, setIdea] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [assisting, setAssisting] = React.useState(false);
  const [generatingAvatar, setGeneratingAvatar] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const knowledgeRef = React.useRef<HTMLInputElement>(null);

  function upd<K extends keyof Draft>(k: K, v: Draft[K]) {
    setD((s) => ({ ...s, [k]: v }));
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Нужен файл изображения");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Размер до 15MB");
      return;
    }
    try {
      const compressed = await compressImage(file, { maxSize: 512, quality: 0.85 });
      upd("avatarUrl", compressed);
    } catch (err: any) {
      toast.error(err?.message || "Не удалось обработать изображение");
    } finally {
      e.target.value = "";
    }
  }

  async function onPickKnowledge(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".txt") && file.type !== "text/plain") {
      toast.error("Нужен .txt файл");
      return;
    }
    if (file.size > 500 * 1024) {
      toast.error("Файл слишком большой (макс 500 КБ)");
      return;
    }
    const text = await file.text();
    upd("knowledge", text);
    toast.success(`Загружено: ${file.name} (${text.length} символов)`);
    e.target.value = "";
  }

  async function onGenerateAvatar() {
    if (!d.name) { toast.error("Сначала укажи имя персонажа"); return; }
    setGeneratingAvatar(true);
    try {
      const { avatarUrl } = await api.generateAvatar({
        name: d.name,
        description: d.description || undefined,
        personality: d.personality || undefined,
        category: d.category || undefined,
      });
      upd("avatarUrl", avatarUrl);
      toast.success("Аватарка сгенерирована!");
    } catch (e: any) {
      toast.error(e.message || "Ошибка генерации");
    } finally {
      setGeneratingAvatar(false);
    }
  }

  async function onAssist() {
    if (!idea.trim()) {
      toast.error("Опиши идею персонажа");
      return;
    }
    setAssisting(true);
    try {
      const { result } = await api.assistCharacter({
        idea,
        kind: d.kind,
        name: d.name || undefined,
        current: d,
      });
      setD((s) => ({
        ...s,
        name: s.name || result.name || "",
        tagline: result.tagline || s.tagline,
        description: result.description || s.description,
        personality: result.personality || s.personality,
        temperament: result.temperament || s.temperament,
        systemPrompt: result.systemPrompt || s.systemPrompt,
        memory: result.memory || s.memory,
        greeting: result.greeting || s.greeting,
        exampleDialog: result.exampleDialog || s.exampleDialog,
        category: result.category || s.category,
        tags: result.tags || s.tags,
      }));
      toast.success("Готово, проверь поля");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAssisting(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!d.name || !d.description || !d.personality || !d.systemPrompt || !d.greeting) {
      toast.error("Заполни имя, описание, характер, system prompt и приветствие");
      return;
    }
    setBusy(true);
    try {
      const { character } = await api.createCharacter(d);
      toast.success("Персонаж создан");
      router.push(`/characters/${character.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Новый персонаж</h1>
        <p className="text-sm text-muted-foreground">
          Опиши идею — AI поможет собрать профиль. Потом доработай детали.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> AI-помощник
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => upd("kind", "character")}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                d.kind === "character"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              Персонаж
            </button>
            <button
              type="button"
              onClick={() => upd("kind", "scenario")}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                d.kind === "scenario"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary",
              )}
            >
              Сценарий / Мир
            </button>
          </div>
          <Textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder={
              d.kind === "scenario"
                ? "Например: школа №47, обычная российская школа, ученики, учителя, перемены, уроки..."
                : "Например: уставший детектив 40-х в Нью-Йорке, циничный, но добрый внутри..."
            }
            className="min-h-[90px]"
          />
          <Button type="button" onClick={onAssist} disabled={assisting}>
            {assisting ? "Генерируем..." : "Сгенерировать профиль"}
          </Button>
        </CardContent>
      </Card>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Основное</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 rounded-2xl">
                {d.avatarUrl ? <AvatarImage src={d.avatarUrl} /> : null}
                <AvatarFallback className="rounded-2xl text-lg">
                  {initials(d.name || "?")}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickFile}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" /> Загрузить аватар
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onGenerateAvatar}
                    disabled={generatingAvatar}
                  >
                    <Wand2 className="h-4 w-4" /> {generatingAvatar ? "Генерируем..." : "Сгенерировать"}
                  </Button>
                  {d.avatarUrl ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => upd("avatarUrl", null)}
                    >
                      <X className="h-4 w-4" /> Убрать
                    </Button>
                  ) : null}
                </div>
                <Input
                  placeholder="Или вставь URL изображения"
                  value={d.avatarUrl?.startsWith("data:") ? "" : d.avatarUrl || ""}
                  onChange={(e) => upd("avatarUrl", e.target.value || null)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Имя</Label>
                <Input
                  value={d.name}
                  onChange={(e) => upd("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Короткий слоган</Label>
                <Input
                  value={d.tagline}
                  onChange={(e) => upd("tagline", e.target.value)}
                  placeholder="Одной фразой"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={d.description}
                onChange={(e) => upd("description", e.target.value)}
                placeholder="Кто это, чем занимается, главные черты..."
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select
                  value={d.category}
                  onValueChange={(v) => upd("category", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Теги (через запятую)</Label>
                <Input
                  value={d.tags}
                  onChange={(e) => upd("tags", e.target.value)}
                  placeholder="ролевка, детектив, нуар"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Личность</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Характер и стиль речи</Label>
              <Textarea
                value={d.personality}
                onChange={(e) => upd("personality", e.target.value)}
                placeholder="Как говорит, что любит, как реагирует..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Темперамент</Label>
              <div className="flex flex-wrap gap-2">
                {TEMPERAMENTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => upd("temperament", t)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-sm",
                      d.temperament === t
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Input
                value={d.temperament}
                onChange={(e) => upd("temperament", e.target.value)}
                placeholder="Свой вариант"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Поведение</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Сценарий (system prompt)</Label>
              <Textarea
                value={d.systemPrompt}
                onChange={(e) => upd("systemPrompt", e.target.value)}
                placeholder="Опиши подробно как персонаж должен себя вести..."
                className="min-h-[120px]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Память о пользователе</Label>
              <Textarea
                value={d.memory}
                onChange={(e) => upd("memory", e.target.value)}
                placeholder="Факты, которые персонаж помнит (опционально)"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> База знаний
              </Label>
              <p className="text-xs text-muted-foreground">
                Загрузи .txt файл с лором, фактами, описанием мира. Персонаж будет опираться на это.
              </p>
              <input
                ref={knowledgeRef}
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={onPickKnowledge}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => knowledgeRef.current?.click()}
                >
                  <Upload className="h-4 w-4" /> Загрузить .txt
                </Button>
                {d.knowledge ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => upd("knowledge", "")}
                  >
                    <X className="h-4 w-4" /> Очистить
                  </Button>
                ) : null}
              </div>
              {d.knowledge ? (
                <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {d.knowledge.slice(0, 2000)}{d.knowledge.length > 2000 ? "..." : ""}
                </div>
              ) : null}
              <Textarea
                value={d.knowledge}
                onChange={(e) => upd("knowledge", e.target.value)}
                placeholder="Или впиши текст вручную..."
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Приветственное сообщение</Label>
              <Textarea
                value={d.greeting}
                onChange={(e) => upd("greeting", e.target.value)}
                placeholder="Первое сообщение, которое увидит пользователь"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Пример диалога</Label>
              <Textarea
                value={d.exampleDialog}
                onChange={(e) => upd("exampleDialog", e.target.value)}
                placeholder={`User: ...\nCharacter: *действие* текст`}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between rounded-xl border p-4">
          <div>
            <div className="font-medium">Публичный персонаж</div>
            <div className="text-sm text-muted-foreground">
              Будет виден в общей библиотеке
            </div>
          </div>
          <Switch
            checked={d.isPublic}
            onCheckedChange={(v) => upd("isPublic", v)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Отмена
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Сохраняем..." : "Создать"}
          </Button>
        </div>
      </form>
    </div>
  );
}
