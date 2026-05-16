import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  theme: z.string().max(30),
});

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(me as any).isPremium) {
    return NextResponse.json({ error: "Нужен CharacterLab+" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad data" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: me.id },
    data: { theme: parsed.data.theme || null },
  });

  return NextResponse.json({ ok: true });
}
