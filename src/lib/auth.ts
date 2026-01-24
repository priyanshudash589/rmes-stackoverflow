/**
 * Authentication Utilities
 * 
 * This module provides authentication functions for the email OTP-based auth system.
 * The application uses email OTP as the primary (and currently only) authentication method.
 * 
 * Key functions:
 * - getCurrentUser: Retrieves the current authenticated user from session cookie
 * - generateSessionToken: Creates a secure random session token
 * - generateOtpCode: Generates a 6-digit OTP code for email verification
 */
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { SESSION } from "./constants";
import type { User } from "@prisma/client";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(SESSION.COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.authSession.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session || session.revoked || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
}

export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

export function generateOtpCode(): string {
  const array = new Uint8Array(3);
  crypto.getRandomValues(array);
  const num =
    ((array[0] << 16) | (array[1] << 8) | array[2]) % 1000000;
  return num.toString().padStart(6, "0");
}

