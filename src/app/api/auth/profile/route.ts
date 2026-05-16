import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/).optional(),
  avatarUrl: z.string().max(8_000_000).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
});

export async function PATCH(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    return NextResponse.json({ error: `${i?.path?.join(".")}: ${i?.message}` }, { status: 400 });
  }

  const data = parsed.data;

  // Проверяем уникальность username
  if (data.username && data.username !== (me as any).username) {
    const exists = await prisma.user.findUnique({ where: { username: data.username } });
    if (exists) {
      return NextResponse.json({ error: "Этот ник уже занят" }, { status: 409 });
    }
  }

  await prisma.user.update({
    where: { id: me.id },
    data: {
      ...(data.username ? { username: data.username } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      ...(data.bio !== undefined ? { bio: data.bio } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
