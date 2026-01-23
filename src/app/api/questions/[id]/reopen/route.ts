import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { ActionType, NotificationEntityType } from "@prisma/client";

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

  const question = await prisma.question.findUnique({
    where: { id: params.id },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  // Only author or manager can reopen
  if (question.createdBy !== user.id && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Must be resolved to reopen
  if (question.status !== "RESOLVED") {
    return NextResponse.json(
      { error: "Only resolved questions can be reopened" },
      { status: 400 }
    );
  }

  const updated = await prisma.question.update({
    where: { id: params.id },
    data: { status: "ACTIVE" },
  });

  // Notify question author
  await createNotification({
    recipientId: question.createdBy,
    actorId: user.id,
    actionType: ActionType.MARK_REOPENED,
    entityType: NotificationEntityType.QUESTION,
    entityId: params.id,
  });

  return NextResponse.json({ question: updated });
}

