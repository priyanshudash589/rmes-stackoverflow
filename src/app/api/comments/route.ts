import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { VALIDATION } from "@/lib/constants";
import { notifyQuestionAuthor, notifyAnswerAuthor } from "@/lib/notifications";
import { ActionType, NotificationEntityType, ParentType } from "@prisma/client";

const createCommentSchema = z.object({
  parentType: z.enum(["QUESTION", "ANSWER"]),
  parentId: z.string().uuid(),
  content: z
    .string()
    .min(1, "Comment content is required")
    .max(VALIDATION.COMMENT_MAX, `Comment must be at most ${VALIDATION.COMMENT_MAX} characters`),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { parentType, parentId, content } = createCommentSchema.parse(body);

    // Verify parent exists
    if (parentType === "QUESTION") {
      const question = await prisma.question.findUnique({
        where: { id: parentId },
      });
      if (!question) {
        return NextResponse.json(
          { error: "Question not found" },
          { status: 404 }
        );
      }
    } else {
      const answer = await prisma.answer.findUnique({
        where: { id: parentId },
      });
      if (!answer) {
        return NextResponse.json({ error: "Answer not found" }, { status: 404 });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        parentType: parentType as ParentType,
        parentId,
        content: content.trim(),
        createdBy: user.id,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    // Send notification
    if (parentType === "QUESTION") {
      await notifyQuestionAuthor(
        parentId,
        user.id,
        ActionType.COMMENT_ADDED,
        NotificationEntityType.COMMENT,
        comment.id
      );
    } else {
      await notifyAnswerAuthor(
        parentId,
        user.id,
        ActionType.COMMENT_ADDED,
        NotificationEntityType.COMMENT,
        comment.id
      );
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

