"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function PersonaPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => api.me() });
  const user = data?.user;
  const [persona, setPersona] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [improving, setImproving] = React.useState(false);
  const loaded = React.useRef(false);

  React.useEffect(() => {
    if (user && !loaded.current) {
      setPersona(user.persona || "");
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

  async function save() {
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

  async function improve() {
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

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Персона</CardTitle>
          <p className="text-sm text-muted-foreground">
            Опиши себя. Персонажи будут опираться на это описание, когда общаются с тобой.
            Это приватное — другие пользователи не видят.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="Например: Меня зовут Артём, мне 19, учусь на программиста. Люблю аниме и рок. Общаюсь неформально."
            className="min-h-[160px]"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={busy}>
              <Save className="h-4 w-4" /> {busy ? "..." : "Сохранить"}
            </Button>
            <Button variant="outline" onClick={improve} disabled={improving}>
              <Sparkles className="h-4 w-4" /> {improving ? "..." : "Улучшить с AI"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
