import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { ActionType, NotificationEntityType, EntityType } from "@prisma/client";

const voteSchema = z.object({
  entityType: z.enum(["ANSWER", "COMMENT"]),
  entityId: z.string().uuid(),
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
    const { entityType, entityId } = voteSchema.parse(body);

    // Check if entity exists and get owner
    let ownerId: string | null = null;

    if (entityType === "ANSWER") {
      const answer = await prisma.answer.findUnique({
        where: { id: entityId },
        select: { createdBy: true },
      });
      if (!answer) {
        return NextResponse.json({ error: "Answer not found" }, { status: 404 });
      }
      ownerId = answer.createdBy;
    } else {
      const comment = await prisma.comment.findUnique({
        where: { id: entityId },
        select: { createdBy: true },
      });
      if (!comment) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }
      ownerId = comment.createdBy;
    }

    // Prevent self-voting
    if (ownerId === user.id) {
      return NextResponse.json(
        { error: "Cannot vote on your own content" },
        { status: 400 }
      );
    }

    // Check if already voted
    const existingVote = await prisma.vote.findUnique({
      where: {
        entityType_entityId_userId: {
          entityType: entityType as EntityType,
          entityId,
          userId: user.id,
        },
      },
    });

    if (existingVote) {
      // Idempotent: already voted, return success
      return NextResponse.json({ message: "Already voted", voted: true });
    }

    // Create vote and update vote_count in transaction
    await prisma.$transaction(async (tx) => {
      await tx.vote.create({
        data: {
          entityType: entityType as EntityType,
          entityId,
          userId: user.id,
        },
      });

      if (entityType === "ANSWER") {
        await tx.answer.update({
          where: { id: entityId },
          data: { voteCount: { increment: 1 } },
        });
      }
    });

    // Notify content owner
    await createNotification({
      recipientId: ownerId,
      actorId: user.id,
      actionType: ActionType.UPVOTE,
      entityType:
        entityType === "ANSWER"
          ? NotificationEntityType.ANSWER
          : NotificationEntityType.COMMENT,
      entityId,
    });

    return NextResponse.json({ message: "Vote recorded", voted: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { entityType, entityId } = voteSchema.parse(body);

    const vote = await prisma.vote.findUnique({
      where: {
        entityType_entityId_userId: {
          entityType: entityType as EntityType,
          entityId,
          userId: user.id,
        },
      },
    });

    if (!vote) {
      return NextResponse.json({ message: "No vote to remove", voted: false });
    }

    // Remove vote and update vote_count in transaction
    await prisma.$transaction(async (tx) => {
      await tx.vote.delete({
        where: { id: vote.id },
      });

      if (entityType === "ANSWER") {
        await tx.answer.update({
          where: { id: entityId },
          data: { voteCount: { decrement: 1 } },
        });
      }
    });

    return NextResponse.json({ message: "Vote removed", voted: false });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Unvote error:", error);
    return NextResponse.json({ error: "Failed to remove vote" }, { status: 500 });
  }
}

