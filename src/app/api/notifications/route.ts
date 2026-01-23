import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread_only") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  const notifications = await prisma.notification.findMany({
    where: {
      recipientId: user.id,
      ...(unreadOnly && { isRead: false }),
    },
    include: {
      actor: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ notifications });
}

