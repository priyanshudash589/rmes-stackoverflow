/**
 * Email OTP Authentication - Request OTP Endpoint
 * 
 * This endpoint implements email-based OTP (One-Time Password) authentication.
 * It is the primary and only authentication method for this internal tool.
 * 
 * Flow:
 * 1. User provides email address
 * 2. System generates 6-digit OTP code
 * 3. OTP is sent via email (or logged in dev mode)
 * 4. User verifies OTP in /api/auth/verify-otp
 * 
 * Note: passwordHash in AuthAccount is optional/nullable, allowing this
 * email OTP-only approach while keeping the schema flexible for future
 * password support if needed.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOtpCode } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/email";
import { OTP } from "@/lib/constants";

const requestSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = requestSchema.parse(body);

    // Rate limit: check for recent OTP requests
    const recentOtp = await prisma.authOtp.findFirst({
      where: {
        email,
        createdAt: {
          gte: new Date(Date.now() - OTP.RATE_LIMIT_MINUTES * 60 * 1000),
        },
        used: false,
      },
    });

    if (recentOtp) {
      return NextResponse.json(
        { error: "Please wait before requesting another code" },
        { status: 429 }
      );
    }

    // Find or prepare user
    let user = await prisma.user.findFirst({
      where: { authAccount: { email } },
      include: { authAccount: true },
    });

    // Generate OTP
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP.EXPIRY_MINUTES * 60 * 1000);

    // Create OTP record
    await prisma.authOtp.create({
      data: {
        email,
        code,
        expiresAt,
        userId: user?.id,
      },
    });

    // Send email
    const emailSent = await sendOtpEmail(email, code);

    if (!emailSent) {
      // For development, log the code
      console.log(`[DEV] OTP for ${email}: ${code}`);
    }

    return NextResponse.json({
      message: "Verification code sent",
      isNewUser: !user,
      requiresName: !user && !name,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Request OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}

