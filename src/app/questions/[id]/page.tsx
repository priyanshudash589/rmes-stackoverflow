import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { QuestionDetail } from "@/components/QuestionDetail";
import { AnswerList } from "@/components/AnswerList";
import { AnswerForm } from "@/components/AnswerForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function QuestionPage({ params }: PageProps) {
  const [question, user] = await Promise.all([
    prisma.question.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { id: true, name: true, role: true } },
        answers: {
          include: {
            author: { select: { id: true, name: true } },
            comments: {
              include: {
                author: { select: { id: true, name: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
          orderBy: [{ voteCount: "desc" }, { updatedAt: "desc" }, { createdAt: "asc" }],
        },
        comments: {
          include: {
            author: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { answers: true } },
      },
    }),
    getCurrentUser(),
  ]);

  if (!question) {
    notFound();
  }

  // Get user votes on answers
  let userVotes: Record<string, boolean> = {};
  if (user) {
    const votes = await prisma.vote.findMany({
      where: {
        userId: user.id,
        entityType: "ANSWER",
        entityId: { in: question.answers.map((a) => a.id) },
      },
    });
    userVotes = Object.fromEntries(votes.map((v) => [v.entityId, true]));
  }

  const canResolve =
    user &&
    (question.createdBy === user.id || user.role === "MANAGER") &&
    question._count.answers > 0;

  return (
    <div className="space-y-8">
      <QuestionDetail
        question={question}
        currentUserId={user?.id}
        canResolve={canResolve || false}
      />

      <section>
        <h2 className="text-xl font-semibold mb-4">
          {question._count.answers} {question._count.answers === 1 ? "Answer" : "Answers"}
        </h2>
        <AnswerList
          answers={question.answers}
          userVotes={userVotes}
          currentUserId={user?.id}
          questionId={question.id}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Your Answer</h2>
        <AnswerForm questionId={question.id} isLoggedIn={!!user} />
      </section>
    </div>
  );
}

