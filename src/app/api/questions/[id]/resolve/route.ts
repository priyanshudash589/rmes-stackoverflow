import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notifyOnResolve } from "@/lib/notifications";

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
    include: { _count: { select: { answers: true } } },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  // Only author or manager can resolve
  if (question.createdBy !== user.id && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Must have at least one answer
  if (question._count.answers === 0) {
    return NextResponse.json(
      { error: "Cannot resolve a question without answers" },
      { status: 400 }
    );
  }

  // Already resolved
  if (question.status === "RESOLVED") {
    return NextResponse.json(
      { error: "Question is already resolved" },
      { status: 400 }
    );
  }

  const updated = await prisma.question.update({
    where: { id: params.id },
    data: { status: "RESOLVED" },
  });

  // Notify question author and answer authors
  await notifyOnResolve(params.id, user.id);

  return NextResponse.json({ question: updated });
}

