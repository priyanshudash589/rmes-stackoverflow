/**
 * Email OTP Authentication - Verify OTP Endpoint
 * 
 * This endpoint verifies the email OTP code and creates a user session.
 * It is the second step in the email OTP authentication flow.
 * 
 * Flow:
 * 1. User provides email and 6-digit OTP code
 * 2. System validates OTP (checks expiry, attempts, code match)
 * 3. If valid, creates/updates user account (no password required)
 * 4. Creates session and sets HTTP-only cookie
 * 
 * Security:
 * - OTP expires after 10 minutes
 * - Max 3 verification attempts per OTP
 * - Rate limiting on OTP requests (1 minute cooldown)
 * - Sessions expire after 7 days
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateSessionToken } from "@/lib/auth";
import { OTP, SESSION } from "@/lib/constants";
import { cookies } from "next/headers";

const verifySchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "Code must be 6 digits"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, name } = verifySchema.parse(body);

    // Find valid OTP
    const otp = await prisma.authOtp.findFirst({
      where: {
        email,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 }
      );
    }

    // Check attempts
    if (otp.attempts >= OTP.MAX_ATTEMPTS) {
      await prisma.authOtp.update({
        where: { id: otp.id },
        data: { used: true },
      });
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 400 }
      );
    }

    // Verify code
    if (otp.code !== code) {
      await prisma.authOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        { error: "Invalid code" },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await prisma.authOtp.update({
      where: { id: otp.id },
      data: { used: true },
    });

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { authAccount: { email } },
    });

    if (!user) {
      if (!name) {
        return NextResponse.json(
          { error: "Name is required for new users", requiresName: true },
          { status: 400 }
        );
      }

      user = await prisma.user.create({
        data: {
          name,
          role: "USER",
          authAccount: {
            create: { email },
          },
        },
      });
    }

    // Update last login
    await prisma.authAccount.update({
      where: { userId: user.id },
      data: { lastLogin: new Date() },
    });

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(
      Date.now() + SESSION.EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    await prisma.authSession.create({
      data: {
        userId: user.id,
        sessionToken,
        expiresAt,
        ipAddress: request.headers.get("x-forwarded-for") || request.ip,
        userAgent: request.headers.get("user-agent"),
      },
    });

    // Set cookie
    const cookieStore = cookies();
    cookieStore.set(SESSION.COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return NextResponse.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}

