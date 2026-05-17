import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  status: z.enum(["reviewed", "closed"]),
  reviewNote: z.string().max(500).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const titles = await prisma.title.findMany({ where: { userId: me.id } });
  const hasAccess =
    me.role === "admin" ||
    titles.some((t) => t.name === "Администратор" || t.name === "Тех.поддержка");
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Bad data" }, { status: 400 });

  const report = await prisma.report.update({
    where: { id: params.id },
    data: { status: parsed.data.status, reviewedBy: me.id, reviewNote: parsed.data.reviewNote },
  });

  return NextResponse.json({ report });
}
