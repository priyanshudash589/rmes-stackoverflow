"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TagPicker } from "@/components/TagPicker";
import { VALIDATION } from "@/lib/constants";

export default function AskQuestionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, tags }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/auth/login?redirect=${encodeURIComponent("/questions/ask")}`);
          return;
        }
        setError(data.error || "Failed to create question");
        return;
      }

      router.push(`/questions/${data.question.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Ask a Question</h1>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's your question? Be specific."
            required
            minLength={VALIDATION.TITLE_MIN}
            maxLength={VALIDATION.TITLE_MAX}
            className="input"
          />
          <p className="mt-1 text-xs text-gray-500">
            {title.length}/{VALIDATION.TITLE_MAX} characters
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Include all the information someone would need to answer your question."
            required
            rows={8}
            maxLength={VALIDATION.DESCRIPTION_MAX}
            className="input resize-y min-h-[200px]"
          />
          <p className="mt-1 text-xs text-gray-500">
            {description.length}/{VALIDATION.DESCRIPTION_MAX} characters
          </p>
        </div>

        <TagPicker
          selectedTags={tags}
          onChange={setTags}
          error={
            tags.length > 0 && tags.length < VALIDATION.TAGS_MIN
              ? `Select at least ${VALIDATION.TAGS_MIN} tags`
              : undefined
          }
        />

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || tags.length < VALIDATION.TAGS_MIN}
            className="btn-primary"
          >
            {loading ? "Posting..." : "Post Question"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

