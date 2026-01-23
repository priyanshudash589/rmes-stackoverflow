import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  await prisma.notification.updateMany({
    where: {
      recipientId: user.id,
      isRead: false,
    },
    data: { isRead: true },
  });

  return NextResponse.json({ message: "All notifications marked as read" });
}

