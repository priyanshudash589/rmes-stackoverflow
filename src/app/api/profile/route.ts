import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * Get current user's profile with contribution statistics
 */
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Get user with auth account and contribution counts
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      authAccount: {
        select: {
          email: true,
        },
      },
      _count: {
        select: {
          questions: true,
          answers: true,
          comments: true,
        },
      },
    },
  });

  if (!profile) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    profile: {
      id: profile.id,
      name: profile.name,
      role: profile.role,
      email: profile.authAccount?.email || null,
      jobTitle: profile.jobTitle || null,
      department: profile.department || null,
      createdAt: profile.createdAt,
      contributions: {
        questionsAsked: profile._count.questions,
        answersGiven: profile._count.answers,
        commentsMade: profile._count.comments,
      },
    },
  });
}

/**
 * Update user profile (name, jobTitle, department)
 */
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, jobTitle, department } = body;

    // Validate input
    if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (jobTitle !== undefined && jobTitle !== null && typeof jobTitle !== "string") {
      return NextResponse.json(
        { error: "Job title must be a string" },
        { status: 400 }
      );
    }

    if (department !== undefined && department !== null && typeof department !== "string") {
      return NextResponse.json(
        { error: "Department must be a string" },
        { status: 400 }
      );
    }

    // Update user profile
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(jobTitle !== undefined && { jobTitle: jobTitle?.trim() || null }),
        ...(department !== undefined && { department: department?.trim() || null }),
      },
      include: {
        authAccount: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            questions: true,
            answers: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({
      profile: {
        id: updated.id,
        name: updated.name,
        role: updated.role,
        email: updated.authAccount?.email || null,
        jobTitle: updated.jobTitle || null,
        department: updated.department || null,
        createdAt: updated.createdAt,
        contributions: {
          questionsAsked: updated._count.questions,
          answersGiven: updated._count.answers,
          commentsMade: updated._count.comments,
        },
      },
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Provide more detailed error message for debugging
    const errorMessage = error?.message || "Failed to update profile";
    const errorCode = error?.code || error?.meta?.code;
    
    // Check if it's a Prisma schema error (columns don't exist)
    if (
      errorCode === "P2003" || 
      errorCode === "P2016" ||
      errorMessage?.includes("Unknown column") ||
      errorMessage?.includes("column") && errorMessage?.includes("does not exist") ||
      error?.meta?.target?.includes("job_title") ||
      error?.meta?.target?.includes("department")
    ) {
      return NextResponse.json(
        { 
          error: "Database schema needs to be updated. The jobTitle and department columns don't exist yet.",
          details: "Please run: npm run db:push (or npx prisma db push) to sync the schema",
          errorCode,
          errorMessage: process.env.NODE_ENV === "development" ? errorMessage : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to update profile",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        errorCode: process.env.NODE_ENV === "development" ? errorCode : undefined
      },
      { status: 500 }
    );
  }
}

