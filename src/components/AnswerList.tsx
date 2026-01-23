"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CommentList } from "./CommentList";
import { CommentForm } from "./CommentForm";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; name: string };
}

interface Answer {
  id: string;
  content: string;
  voteCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string };
  comments: Comment[];
}

interface AnswerListProps {
  answers: Answer[];
  userVotes: Record<string, boolean>;
  currentUserId?: string;
  questionId: string;
}

export function AnswerList({
  answers,
  userVotes,
  currentUserId,
  questionId,
}: AnswerListProps) {
  const router = useRouter();

  if (answers.length === 0) {
    return (
      <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
        No answers yet. Be the first to answer!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {answers.map((answer) => (
        <AnswerCard
          key={answer.id}
          answer={answer}
          hasVoted={userVotes[answer.id] || false}
          currentUserId={currentUserId}
          questionId={questionId}
          onRefresh={() => router.refresh()}
        />
      ))}
    </div>
  );
}

interface AnswerCardProps {
  answer: Answer;
  hasVoted: boolean;
  currentUserId?: string;
  questionId: string;
  onRefresh: () => void;
}

function AnswerCard({
  answer,
  hasVoted,
  currentUserId,
  questionId,
  onRefresh,
}: AnswerCardProps) {
  const router = useRouter();
  const [voted, setVoted] = useState(hasVoted);
  const [voteCount, setVoteCount] = useState(answer.voteCount);
  const [voting, setVoting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  const handleVote = async () => {
    if (!currentUserId) {
      router.push(
        `/auth/login?redirect=${encodeURIComponent(`/questions/${questionId}`)}`
      );
      return;
    }

    if (answer.author.id === currentUserId) {
      return; // Can't vote on own answer
    }

    setVoting(true);
    try {
      const res = await fetch("/api/votes", {
        method: voted ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "ANSWER", entityId: answer.id }),
      });

      if (res.ok) {
        setVoted(!voted);
        setVoteCount((c) => (voted ? c - 1 : c + 1));
      }
    } finally {
      setVoting(false);
    }
  };

  return (
    <article className="card p-5">
      <div className="flex gap-4">
        {/* Vote button */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleVote}
            disabled={voting || answer.author.id === currentUserId}
            className={`p-2 rounded-lg transition-colors ${
              voted
                ? "text-primary-600 bg-primary-50 dark:bg-primary-900/20"
                : "text-gray-400 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            } ${answer.author.id === currentUserId ? "opacity-50 cursor-not-allowed" : ""}`}
            title={
              answer.author.id === currentUserId
                ? "Can't vote on your own answer"
                : voted
                ? "Remove vote"
                : "Upvote"
            }
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            {voteCount}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="prose prose-gray dark:prose-invert max-w-none mb-4">
            <p className="whitespace-pre-wrap">{answer.content}</p>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Answered by <strong>{answer.author.name}</strong> on{" "}
              {new Date(answer.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Comments */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <CommentList comments={answer.comments} />

            {showCommentForm ? (
              <CommentForm
                parentType="ANSWER"
                parentId={answer.id}
                onSuccess={() => {
                  setShowCommentForm(false);
                  onRefresh();
                }}
                onCancel={() => setShowCommentForm(false)}
              />
            ) : (
              <button
                onClick={() => {
                  if (!currentUserId) {
                    router.push(
                      `/auth/login?redirect=${encodeURIComponent(`/questions/${questionId}`)}`
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
        </div>
      </div>
    </article>
  );
}

