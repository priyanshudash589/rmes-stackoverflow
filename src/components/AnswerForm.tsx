"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VALIDATION } from "@/lib/constants";

interface AnswerFormProps {
  questionId: string;
  isLoggedIn: boolean;
}

export function AnswerForm({ questionId, isLoggedIn }: AnswerFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isLoggedIn) {
    return (
      <div className="card p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Sign in to post an answer
        </p>
        <a
          href={`/auth/login?redirect=${encodeURIComponent(`/questions/${questionId}`)}`}
          className="btn-primary"
        >
          Sign In
        </a>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Answer content is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to post answer");
        return;
      }

      setContent("");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your answer here..."
          rows={6}
          maxLength={VALIDATION.ANSWER_MAX}
          className="input resize-y min-h-[150px]"
        />
        <p className="mt-1 text-xs text-gray-500">
          {content.length}/{VALIDATION.ANSWER_MAX} characters
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="btn-primary"
      >
        {loading ? "Posting..." : "Post Answer"}
      </button>
    </form>
  );
}

