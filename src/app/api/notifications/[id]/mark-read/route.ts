import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const notification = await prisma.notification.findUnique({
    where: { id: params.id },
  });

  if (!notification) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 }
    );
  }

  if (notification.recipientId !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await prisma.notification.update({
    where: { id: params.id },
    data: { isRead: true },
  });

  return NextResponse.json({ message: "Marked as read" });
}

