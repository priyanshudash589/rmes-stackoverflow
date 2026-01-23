import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { QuestionCard } from "@/components/QuestionCard";
import { SearchBar } from "@/components/SearchBar";
import { TagFilter } from "@/components/TagFilter";
import { PREDEFINED_TAGS } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { search?: string; tags?: string | string[]; status?: string };
}

export default async function HomePage({ searchParams }: PageProps) {
  const search = searchParams.search || "";
  const selectedTags = searchParams.tags
    ? Array.isArray(searchParams.tags)
      ? searchParams.tags
      : [searchParams.tags]
    : [];
  const statusFilter = searchParams.status || "";

  const questions = await prisma.question.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        selectedTags.length > 0 ? { tags: { hasSome: selectedTags } } : {},
        statusFilter ? { status: statusFilter as any } : {},
      ],
    },
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { answers: true, comments: true } },
    },
    orderBy: [
      { status: "desc" }, // RESOLVED > ACTIVE > OPEN
      { updatedAt: "desc" },
    ],
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Questions</h1>
        <Link href="/questions/ask" className="btn-primary">
          Ask Question
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar defaultValue={search} />
        </div>
        <TagFilter tags={PREDEFINED_TAGS} selectedTags={selectedTags} />
      </div>

      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No questions found. Be the first to ask!
            </p>
          </div>
        ) : (
          questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))
        )}
      </div>
    </div>
  );
}

