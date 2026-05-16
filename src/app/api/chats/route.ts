import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ items: [] });

  const items = await prisma.chat.findMany({
    where: { userId: me.id },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      character: {
        select: { id: true, name: true, avatarUrl: true, tagline: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, role: true, createdAt: true },
      },
    },
  });

  return NextResponse.json({ items });
}

const createSchema = z.object({ characterId: z.string().min(1) });

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad data" }, { status: 400 });
  }

  const ch = await prisma.character.findUnique({
    where: { id: parsed.data.characterId },
  });
  if (!ch) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!ch.isPublic && ch.authorId !== me.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const chat = await prisma.chat.create({
    data: {
      userId: me.id,
      characterId: ch.id,
      title: ch.name,
    },
  });

  if (ch.greeting?.trim()) {
    await prisma.message.create({
      data: { chatId: chat.id, role: "assistant", content: ch.greeting },
    });
  }

  return NextResponse.json({ chat });
}
