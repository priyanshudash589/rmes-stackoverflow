import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { VALIDATION } from "@/lib/constants";
import { notifyQuestionAuthor } from "@/lib/notifications";
import { ActionType, NotificationEntityType } from "@prisma/client";

const createAnswerSchema = z.object({
  content: z
    .string()
    .min(1, "Answer content is required")
    .max(VALIDATION.ANSWER_MAX, `Answer must be at most ${VALIDATION.ANSWER_MAX} characters`),
});

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

  try {
    const body = await request.json();
    const { content } = createAnswerSchema.parse(body);

    // Create answer and update question status in transaction
    const [answer] = await prisma.$transaction([
      prisma.answer.create({
        data: {
          content: content.trim(),
          questionId: params.id,
          createdBy: user.id,
        },
        include: {
          author: { select: { id: true, name: true } },
        },
      }),
      // Auto-transition OPEN → ACTIVE on first answer
      ...(question.status === "OPEN" && question._count.answers === 0
        ? [
            prisma.question.update({
              where: { id: params.id },
              data: { status: "ACTIVE" },
            }),
          ]
        : []),
    ]);

    // Notify question author
    await notifyQuestionAuthor(
      params.id,
      user.id,
      ActionType.ANSWER_ADDED,
      NotificationEntityType.ANSWER,
      answer.id
    );

    return NextResponse.json({ answer }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Create answer error:", error);
    return NextResponse.json(
      { error: "Failed to create answer" },
      { status: 500 }
    );
  }
}

