import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: { username: string } },
) {
  const me = await getCurrentUser();

  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      isPremium: true,
      createdAt: true,
      characters: {
        where: { isPublic: true },
        orderBy: { likesCount: "desc" },
        take: 20,
        include: {
          author: { select: { username: true } },
          likes: me ? { where: { userId: me.id }, select: { id: true } } : false,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const characters = user.characters.map((c: any) => ({
    ...c,
    likedByMe: Array.isArray(c.likes) ? c.likes.length > 0 : false,
    likes: undefined,
  }));

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isPremium: user.isPremium,
      createdAt: user.createdAt,
      characterCount: characters.length,
    },
    characters,
  });
}
