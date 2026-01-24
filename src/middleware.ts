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

// Routes that require authentication but are not mutations
const AUTHENTICATED_GET_ROUTES = [
  "/api/profile",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for authenticated routes (GET, POST, PATCH, DELETE)
  const isAuthenticatedRoute = AUTHENTICATED_GET_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedApiRoute = PROTECTED_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isMutationMethod = ["POST", "PATCH", "DELETE"].includes(request.method);

  if (isAuthenticatedRoute || (isProtectedApiRoute && isMutationMethod)) {
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

