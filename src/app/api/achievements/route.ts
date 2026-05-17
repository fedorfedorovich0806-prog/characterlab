import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ACHIEVEMENTS } from "@/lib/achievements";

export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ items: [], all: ACHIEVEMENTS });

  const earned = await prisma.achievement.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: earned,
    all: ACHIEVEMENTS.map((a) => ({
      ...a,
      earned: earned.some((e) => e.key === a.key),
    })),
  });
}
