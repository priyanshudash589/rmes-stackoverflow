import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION } from "@/lib/constants";

export async function GET() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION.COOKIE_NAME)?.value;

  if (sessionToken) {
    // Revoke session in database
    await prisma.authSession.updateMany({
      where: { sessionToken },
      data: { revoked: true },
    });
  }

  // Clear cookie
  cookieStore.delete(SESSION.COOKIE_NAME);

  // Redirect to home
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}

export async function POST() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION.COOKIE_NAME)?.value;

  if (sessionToken) {
    await prisma.authSession.updateMany({
      where: { sessionToken },
      data: { revoked: true },
    });
  }

  cookieStore.delete(SESSION.COOKIE_NAME);

  return NextResponse.json({ message: "Logged out successfully" });
}

