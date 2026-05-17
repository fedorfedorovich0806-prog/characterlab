import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  username: z.string().min(1),
  name: z.string().min(1).max(60),
  color: z.enum(["gold", "red", "blue", "purple", "green"]).default("gold"),
});

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!target) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  const title = await prisma.title.create({
    data: {
      userId: target.id,
      name: parsed.data.name,
      color: parsed.data.color,
      grantedBy: me.id,
    },
  });

  // Уведомление
  await prisma.notification.create({
    data: {
      userId: target.id,
      title: "Новый титул!",
      body: `Тебе выдан титул "${parsed.data.name}"`,
      fromBot: true,
    },
  });

  return NextResponse.json({ title });
}
