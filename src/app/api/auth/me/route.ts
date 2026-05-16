import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });

  // Подтягиваем непрочитанные уведомления
  const unread = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return NextResponse.json({
    user: { ...user, unreadNotifications: unread },
  });
}
