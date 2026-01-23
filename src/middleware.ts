import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION } from "./lib/constants";

// Routes that require authentication for mutations
const PROTECTED_API_ROUTES = [
  "/api/questions",
  "/api/comments",
  "/api/votes",
  "/api/notifications",
];

// Routes that don't need session check
const PUBLIC_ROUTES = [
  "/api/auth/request-otp",
  "/api/auth/verify-otp",
  "/api/auth/me",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for protected API routes (POST, PATCH, DELETE)
  const isProtectedApiRoute = PROTECTED_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isMutationMethod = ["POST", "PATCH", "DELETE"].includes(request.method);

  if (isProtectedApiRoute && isMutationMethod) {
    const sessionToken = request.cookies.get(SESSION.COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};

