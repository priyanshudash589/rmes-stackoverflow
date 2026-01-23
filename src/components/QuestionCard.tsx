import Link from "next/link";
import { QuestionStatus } from "@prisma/client";

interface QuestionCardProps {
  question: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    status: QuestionStatus;
    createdAt: Date;
    updatedAt: Date;
    author: { id: string; name: string };
    _count: { answers: number; comments: number };
  };
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

export function QuestionCard({ question }: QuestionCardProps) {
  const timeAgo = getTimeAgo(question.createdAt);

  return (
    <Link href={`/questions/${question.id}`} className="block">
      <article className="card p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={statusColors[question.status]}>
                {statusLabels[question.status]}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {question._count.answers} answers
              </span>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate mb-2">
              {question.title}
            </h2>

            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
              {question.description}
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              {question.tags.map((tag) => (
                <span key={tag} className="badge-muted">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="text-right text-sm text-gray-500 dark:text-gray-400 shrink-0">
            <div>{question.author.name}</div>
            <div>{timeAgo}</div>
          </div>
        </div>
      </article>
    </Link>
  );
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

