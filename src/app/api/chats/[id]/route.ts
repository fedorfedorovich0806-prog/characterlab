import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const chat = await prisma.chat.findUnique({
    where: { id: params.id },
    include: {
      character: true,
    },
  });
  if (!chat || chat.userId !== me.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const messages = await prisma.message.findMany({
    where: { chatId: chat.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ chat, messages });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const chat = await prisma.chat.findUnique({ where: { id: params.id } });
  if (!chat || chat.userId !== me.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.chat.delete({ where: { id: chat.id } });
  return NextResponse.json({ ok: true });
}
