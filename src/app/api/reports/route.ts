import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const createSchema = z.object({
  targetType: z.enum(["character", "user", "chat"]),
  targetId: z.string().min(1),
  reason: z.string().min(5).max(1000),
});

export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const report = await prisma.report.create({
    data: { authorId: me.id, ...parsed.data },
  });

  return NextResponse.json({ report });
}

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Только админы и люди с титулом "Администратор" или "Тех.поддержка"
  const titles = await prisma.title.findMany({ where: { userId: me.id } });
  const hasAccess =
    me.role === "admin" ||
    titles.some((t) => t.name === "Администратор" || t.name === "Тех.поддержка");

  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "open";

  const reports = await prisma.report.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { author: { select: { username: true } } },
  });

  return NextResponse.json({ reports });
}
