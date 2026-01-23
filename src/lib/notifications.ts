import { prisma } from "./prisma";
import { ActionType, NotificationEntityType } from "@prisma/client";

interface CreateNotificationParams {
  recipientId: string;
  actorId: string;
  actionType: ActionType;
  entityType: NotificationEntityType;
  entityId: string;
}

export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  // Never notify the actor themselves
  if (params.recipientId === params.actorId) {
    return;
  }

  await prisma.notification.create({
    data: params,
  });
}

export async function notifyQuestionAuthor(
  questionId: string,
  actorId: string,
  actionType: ActionType,
  entityType: NotificationEntityType,
  entityId: string
): Promise<void> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { createdBy: true },
  });

  if (question) {
    await createNotification({
      recipientId: question.createdBy,
      actorId,
      actionType,
      entityType,
      entityId,
    });
  }
}

export async function notifyAnswerAuthor(
  answerId: string,
  actorId: string,
  actionType: ActionType,
  entityType: NotificationEntityType,
  entityId: string
): Promise<void> {
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: { createdBy: true },
  });

  if (answer) {
    await createNotification({
      recipientId: answer.createdBy,
      actorId,
      actionType,
      entityType,
      entityId,
    });
  }
}

export async function notifyOnResolve(
  questionId: string,
  actorId: string
): Promise<void> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      answers: { select: { createdBy: true } },
    },
  });

  if (!question) return;

  // Notify question author
  await createNotification({
    recipientId: question.createdBy,
    actorId,
    actionType: ActionType.MARK_RESOLVED,
    entityType: NotificationEntityType.QUESTION,
    entityId: questionId,
  });

  // Notify all answer authors
  const uniqueAuthors = [...new Set(question.answers.map((a) => a.createdBy))];
  for (const authorId of uniqueAuthors) {
    if (authorId !== question.createdBy) {
      await createNotification({
        recipientId: authorId,
        actorId,
        actionType: ActionType.MARK_RESOLVED,
        entityType: NotificationEntityType.QUESTION,
        entityId: questionId,
      });
    }
  }
}

