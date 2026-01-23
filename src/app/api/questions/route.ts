import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { VALIDATION, PREDEFINED_TAGS } from "@/lib/constants";

const createQuestionSchema = z.object({
  title: z
    .string()
    .min(VALIDATION.TITLE_MIN, `Title must be at least ${VALIDATION.TITLE_MIN} characters`)
    .max(VALIDATION.TITLE_MAX, `Title must be at most ${VALIDATION.TITLE_MAX} characters`),
  description: z
    .string()
    .min(1, "Description is required")
    .max(VALIDATION.DESCRIPTION_MAX, `Description must be at most ${VALIDATION.DESCRIPTION_MAX} characters`),
  tags: z
    .array(z.enum(PREDEFINED_TAGS as unknown as [string, ...string[]]))
    .min(VALIDATION.TAGS_MIN, `Select at least ${VALIDATION.TAGS_MIN} tags`)
    .max(VALIDATION.TAGS_MAX, `Select at most ${VALIDATION.TAGS_MAX} tags`),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const tags = searchParams.getAll("tags");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (tags.length > 0) {
    where.tags = { hasSome: tags };
  }

  if (status) {
    where.status = status;
  }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { answers: true, comments: true } },
      },
      orderBy: [
        { status: "desc" }, // RESOLVED > ACTIVE > OPEN
        { updatedAt: "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.question.count({ where }),
  ]);

  return NextResponse.json({
    questions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { title, description, tags } = createQuestionSchema.parse(body);

    const question = await prisma.question.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        tags,
        status: "OPEN",
        createdBy: user.id,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Create question error:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}

