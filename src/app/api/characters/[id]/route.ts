import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const me = await getCurrentUser();
  const c = await prisma.character.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      likes: me ? { where: { userId: me.id }, select: { id: true } } : false,
    },
  });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!c.isPublic && c.authorId !== me?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const likedByMe = Array.isArray((c as any).likes) ? (c as any).likes.length > 0 : false;
  return NextResponse.json({
    character: {
      ...c,
      likes: undefined,
      likedByMe,
      isMine: c.authorId === me?.id,
    },
  });
}

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  tagline: z.string().max(300).nullable().optional(),
  description: z.string().min(1).max(5000).optional(),
  avatarUrl: z.string().max(8_000_000).nullable().optional(),
  kind: z.enum(["character", "scenario"]).optional(),
  personality: z.string().min(1).max(5000).optional(),
  temperament: z.string().max(2000).nullable().optional(),
  systemPrompt: z.string().min(1).max(20000).optional(),
  memory: z.string().max(10000).nullable().optional(),
  knowledge: z.string().max(200000).nullable().optional(),
  greeting: z.string().min(1).max(5000).optional(),
  exampleDialog: z.string().max(10000).nullable().optional(),
  category: z.string().min(1).max(60).optional(),
  tags: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await prisma.character.findUnique({ where: { id: params.id } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (c.authorId !== me.id && me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    const field = i?.path?.join(".") || "field";
    return NextResponse.json(
      { error: `${field}: ${i?.message || "Bad data"}` },
      { status: 400 },
    );
  }
  const character = await prisma.character.update({
    where: { id: c.id },
    data: parsed.data,
  });
  return NextResponse.json({ character });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const c = await prisma.character.findUnique({ where: { id: params.id } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (c.authorId !== me.id && me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.character.delete({ where: { id: c.id } });
  return NextResponse.json({ ok: true });
}
