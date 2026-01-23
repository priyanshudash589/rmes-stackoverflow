"use client";

import clsx from "clsx";
import { PREDEFINED_TAGS, VALIDATION } from "@/lib/constants";

interface TagPickerProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  error?: string;
}

export function TagPicker({ selectedTags, onChange, error }: TagPickerProps) {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else if (selectedTags.length < VALIDATION.TAGS_MAX) {
      onChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Tags
        </label>
        <span className="text-xs text-gray-500">
          {selectedTags.length}/{VALIDATION.TAGS_MAX} selected (min{" "}
          {VALIDATION.TAGS_MIN})
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {PREDEFINED_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={clsx(
              "badge cursor-pointer transition-all",
              selectedTags.includes(tag)
                ? "bg-primary-600 text-white ring-2 ring-primary-300"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
              selectedTags.length >= VALIDATION.TAGS_MAX &&
                !selectedTags.includes(tag) &&
                "opacity-50 cursor-not-allowed"
            )}
          >
            {tag}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

