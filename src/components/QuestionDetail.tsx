"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionStatus } from "@prisma/client";
import { CommentList } from "./CommentList";
import { CommentForm } from "./CommentForm";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; name: string };
}

interface QuestionDetailProps {
  question: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    status: QuestionStatus;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    author: { id: string; name: string; role: string };
    comments: Comment[];
  };
  currentUserId?: string;
  canResolve: boolean;
}

const statusColors: Record<QuestionStatus, string> = {
  OPEN: "badge-warning",
  ACTIVE: "badge-primary",
  RESOLVED: "badge-success",
};

const statusLabels: Record<QuestionStatus, string> = {
  OPEN: "Open",
  ACTIVE: "Active",
  RESOLVED: "Resolved",
};

export function QuestionDetail({
  question,
  currentUserId,
  canResolve,
}: QuestionDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  const handleResolve = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/questions/${question.id}/resolve`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/questions/${question.id}/reopen`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className={statusColors[question.status]}>
              {statusLabels[question.status]}
            </span>
            {question.tags.map((tag) => (
              <span key={tag} className="badge-muted">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {question.title}
          </h1>
        </div>

        {canResolve && (
          <div className="shrink-0">
            {question.status === "RESOLVED" ? (
              <button
                onClick={handleReopen}
                disabled={loading}
                className="btn-secondary text-sm"
              >
                {loading ? "..." : "Reopen"}
              </button>
            ) : (
              <button
                onClick={handleResolve}
                disabled={loading}
                className="btn-primary text-sm"
              >
                {loading ? "..." : "Mark Resolved"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="whitespace-pre-wrap">{question.description}</p>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-800">
        <span>
          Asked by <strong>{question.author.name}</strong> on{" "}
          {new Date(question.createdAt).toLocaleDateString()}
        </span>
        {question.createdAt.toString() !== question.updatedAt.toString() && (
          <span>
            Updated {new Date(question.updatedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Comments section */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
        <CommentList comments={question.comments} />

        {showCommentForm ? (
          <CommentForm
            parentType="QUESTION"
            parentId={question.id}
            onSuccess={() => {
              setShowCommentForm(false);
              router.refresh();
            }}
            onCancel={() => setShowCommentForm(false)}
          />
        ) : (
          <button
            onClick={() => {
              if (!currentUserId) {
                router.push(
                  `/auth/login?redirect=${encodeURIComponent(`/questions/${question.id}`)}`
                );
                return;
              }
              setShowCommentForm(true);
            }}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Add a comment
          </button>
        )}
      </div>
    </article>
  );
}

