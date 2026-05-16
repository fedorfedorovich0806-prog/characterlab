import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.like.findUnique({
    where: { userId_characterId: { userId: me.id, characterId: params.id } },
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    const updated = await prisma.character.update({
      where: { id: params.id },
      data: { likesCount: { decrement: 1 } },
    });
    return NextResponse.json({ liked: false, likesCount: updated.likesCount });
  }

  const ch = await prisma.character.findUnique({ where: { id: params.id } });
  if (!ch) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.like.create({
    data: { userId: me.id, characterId: params.id },
  });
  const updated = await prisma.character.update({
    where: { id: params.id },
    data: { likesCount: { increment: 1 } },
  });
  return NextResponse.json({ liked: true, likesCount: updated.likesCount });
}
