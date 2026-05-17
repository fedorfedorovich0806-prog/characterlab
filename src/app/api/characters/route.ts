import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { checkAchievements } from "@/lib/achievements";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const category = url.searchParams.get("category")?.trim() || "";
  const sort = url.searchParams.get("sort") || "trending";
  const mine = url.searchParams.get("mine") === "1";

  const me = await getCurrentUser();

  const where: any = {};
  if (mine) {
    if (!me) return NextResponse.json({ items: [] });
    where.authorId = me.id;
  } else {
    where.OR = [{ isPublic: true }, me ? { authorId: me.id } : undefined].filter(
      Boolean,
    );
  }
  if (category) where.category = category;
  if (q) {
    where.AND = [
      {
        OR: [
          { name: { contains: q } },
          { tagline: { contains: q } },
          { description: { contains: q } },
          { tags: { contains: q } },
        ],
      },
    ];
  }

  const orderBy =
    sort === "new"
      ? [{ createdAt: "desc" as const }]
      : [{ likesCount: "desc" as const }, { messagesCount: "desc" as const }];

  const items = await prisma.character.findMany({
    where,
    orderBy,
    take: 60,
    include: {
      author: { select: { username: true } },
      likes: me ? { where: { userId: me.id }, select: { id: true } } : false,
    },
  });

  return NextResponse.json({
    items: items.map((c: any) => ({
      id: c.id,
      name: c.name,
      tagline: c.tagline,
      description: c.description,
      avatarUrl: c.avatarUrl,
      category: c.category,
      tags: c.tags,
      isPublic: c.isPublic,
      likesCount: c.likesCount,
      messagesCount: c.messagesCount,
      author: c.author,
      likedByMe: Array.isArray(c.likes) ? c.likes.length > 0 : false,
    })),
  });
}

const createSchema = z.object({
  name: z.string().min(1).max(200),
  tagline: z.string().max(300).optional().nullable(),
  description: z.string().min(1).max(5000),
  avatarUrl: z.string().max(8_000_000).optional().nullable(), // data URL допускается
  kind: z.enum(["character", "scenario"]).default("character"),
  personality: z.string().min(1).max(5000),
  temperament: z.string().max(2000).optional().nullable(),
  systemPrompt: z.string().min(1).max(20000),
  memory: z.string().max(10000).optional().nullable(),
  knowledge: z.string().max(200000).optional().nullable(),
  greeting: z.string().min(1).max(5000),
  exampleDialog: z.string().max(10000).optional().nullable(),
  category: z.string().min(1).max(60).default("general"),
  tags: z.string().max(500).optional().default(""),
  isPublic: z.boolean().default(true),
});

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const i = parsed.error.issues[0];
    const field = i?.path?.join(".") || "field";
    return NextResponse.json(
      { error: `${field}: ${i?.message || "Bad data"}` },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const character = await prisma.character.create({
    data: {
      name: data.name,
      tagline: data.tagline || null,
      description: data.description,
      avatarUrl: data.avatarUrl || null,
      kind: data.kind,
      personality: data.personality,
      temperament: data.temperament || null,
      systemPrompt: data.systemPrompt,
      memory: data.memory || null,
      knowledge: data.knowledge || null,
      greeting: data.greeting,
      exampleDialog: data.exampleDialog || null,
      category: data.category,
      tags: (data.tags || "").toLowerCase(),
      isPublic: data.isPublic,
      authorId: me.id,
    },
  });

  // Проверяем достижения (фоново)
  checkAchievements(me.id).catch(() => {});

  return NextResponse.json({ character });
}
