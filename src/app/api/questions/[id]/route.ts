import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { VALIDATION, PREDEFINED_TAGS } from "@/lib/constants";

const updateQuestionSchema = z.object({
  title: z
    .string()
    .min(VALIDATION.TITLE_MIN)
    .max(VALIDATION.TITLE_MAX)
    .optional(),
  description: z
    .string()
    .min(1)
    .max(VALIDATION.DESCRIPTION_MAX)
    .optional(),
  tags: z
    .array(z.enum(PREDEFINED_TAGS as unknown as [string, ...string[]]))
    .min(VALIDATION.TAGS_MIN)
    .max(VALIDATION.TAGS_MAX)
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const question = await prisma.question.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, name: true, role: true } },
      answers: {
        include: {
          author: { select: { id: true, name: true } },
          comments: {
            include: {
              author: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { votes: true } },
        },
        orderBy: [{ voteCount: "desc" }, { updatedAt: "desc" }, { createdAt: "asc" }],
      },
      comments: {
        include: {
          author: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { answers: true, comments: true } },
    },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  // Check if current user has voted on answers
  const user = await getCurrentUser();
  let userVotes: Record<string, boolean> = {};

  if (user) {
    const votes = await prisma.vote.findMany({
      where: {
        userId: user.id,
        entityType: "ANSWER",
        entityId: { in: question.answers.map((a) => a.id) },
      },
    });
    userVotes = Object.fromEntries(votes.map((v) => [v.entityId, true]));
  }

  return NextResponse.json({
    question,
    userVotes,
    currentUserId: user?.id,
  });
}

export async function PATCH(
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

  // Check permission: author or manager
  if (question.createdBy !== user.id && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = updateQuestionSchema.parse(body);

    const updated = await prisma.question.update({
      where: { id: params.id },
      data: {
        ...(data.title && { title: data.title.trim() }),
        ...(data.description && { description: data.description.trim() }),
        ...(data.tags && { tags: data.tags }),
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ question: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Update question error:", error);
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

  // Only author or manager can delete
  if (question.createdBy !== user.id && user.role !== "MANAGER") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await prisma.question.delete({ where: { id: params.id } });

  return NextResponse.json({ message: "Question deleted" });
}

