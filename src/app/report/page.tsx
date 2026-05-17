"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReportPage() {
  const router = useRouter();
  const [type, setType] = React.useState("character");
  const [targetId, setTargetId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [sending, setSending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetId.trim() || !reason.trim()) {
      toast.error("Заполни все поля");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetType: type, targetId: targetId.trim(), reason: reason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Жалоба отправлена. Спасибо!");
      router.push("/");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container max-w-lg py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-destructive" /> Пожаловаться
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Опиши проблему. Модерация рассмотрит в течение 24 часов.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Тип нарушения</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="character">Персонаж</SelectItem>
                  <SelectItem value="user">Пользователь</SelectItem>
                  <SelectItem value="chat">Чат</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {type === "character" ? "Имя или ID персонажа" : type === "user" ? "Username нарушителя" : "ID чата"}
              </Label>
              <Input
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder={type === "user" ? "@username" : "Имя или ID"}
              />
            </div>
            <div className="space-y-2">
              <Label>Причина жалобы</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Опиши что не так..."
                className="min-h-[100px]"
              />
            </div>
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? "Отправляем..." : "Отправить жалобу"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
