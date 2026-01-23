"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import clsx from "clsx";

interface TagFilterProps {
  tags: readonly string[];
  selectedTags: string[];
}

export function TagFilter({ tags, selectedTags }: TagFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const toggleTag = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.getAll("tags");

    if (current.includes(tag)) {
      params.delete("tags");
      current.filter((t) => t !== tag).forEach((t) => params.append("tags", t));
    } else {
      params.append("tags", tag);
    }

    startTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.slice(0, 8).map((tag) => (
        <button
          key={tag}
          onClick={() => toggleTag(tag)}
          disabled={isPending}
          className={clsx(
            "badge cursor-pointer transition-colors",
            selectedTags.includes(tag)
              ? "bg-primary-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

