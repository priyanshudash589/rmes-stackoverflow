"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActionType, NotificationEntityType } from "@prisma/client";

interface Notification {
  id: string;
  actionType: ActionType;
  entityType: NotificationEntityType;
  entityId: string;
  isRead: boolean;
  createdAt: Date;
  actor: { id: string; name: string };
}

interface NotificationListProps {
  notifications: Notification[];
}

const actionLabels: Record<ActionType, string> = {
  ANSWER_ADDED: "answered your question",
  COMMENT_ADDED: "commented on your",
  UPVOTE: "upvoted your",
  EDITED: "edited your",
  MARK_RESOLVED: "marked your question as resolved",
  MARK_REOPENED: "reopened your question",
};

const entityLabels: Record<NotificationEntityType, string> = {
  QUESTION: "question",
  ANSWER: "answer",
  COMMENT: "comment",
};

export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter();

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/mark-read`, { method: "POST" });
    router.refresh();
  };

  if (notifications.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No notifications yet. You'll see activity here when someone interacts
          with your content.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((notification) => {
        const href = getNotificationLink(notification);

        return (
          <div
            key={notification.id}
            className={`card p-4 flex items-start gap-4 ${
              !notification.isRead
                ? "border-l-4 border-l-primary-500"
                : "opacity-75"
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 dark:text-gray-100">
                <strong>{notification.actor.name}</strong>{" "}
                {getActionText(notification)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {getTimeAgo(notification.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {href && (
                <Link href={href} className="btn-ghost text-sm py-1.5 px-3">
                  View
                </Link>
              )}
              {!notification.isRead && (
                <button
                  onClick={() => handleMarkRead(notification.id)}
                  className="btn-ghost text-sm py-1.5 px-3"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getActionText(notification: Notification): string {
  const action = actionLabels[notification.actionType];
  const entity = entityLabels[notification.entityType];

  if (
    notification.actionType === "ANSWER_ADDED" ||
    notification.actionType === "MARK_RESOLVED" ||
    notification.actionType === "MARK_REOPENED"
  ) {
    return action;
  }

  return `${action} ${entity}`;
}

function getNotificationLink(notification: Notification): string | null {
  switch (notification.entityType) {
    case "QUESTION":
      return `/questions/${notification.entityId}`;
    case "ANSWER":
      // For answers, we'd need the question ID - for now link to home
      return "/";
    case "COMMENT":
      return "/";
    default:
      return null;
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

