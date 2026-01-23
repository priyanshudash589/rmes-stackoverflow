"use client";

import { useState } from "react";
import { VALIDATION } from "@/lib/constants";

interface CommentFormProps {
  parentType: "QUESTION" | "ANSWER";
  parentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CommentForm({
  parentType,
  parentId,
  onSuccess,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Comment content is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentType, parentId, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to post comment");
        return;
      }

      onSuccess();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        rows={2}
        maxLength={VALIDATION.COMMENT_MAX}
        className="input text-sm resize-none"
        autoFocus
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="btn-primary text-sm py-1.5 px-3"
        >
          {loading ? "Posting..." : "Post Comment"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost text-sm py-1.5 px-3"
        >
          Cancel
        </button>
        <span className="text-xs text-gray-400 ml-auto">
          {content.length}/{VALIDATION.COMMENT_MAX}
        </span>
      </div>
    </form>
  );
}

