import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(
  email: string,
  code: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@company.com",
      to: email,
      subject: "Your Login Code - Internal Q&A",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0ea5e9; margin-bottom: 24px;">Internal Q&A Platform</h2>
          <p style="color: #374151; font-size: 16px; margin-bottom: 16px;">
            Your verification code is:
          </p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">
              ${code}
            </span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This code expires in 10 minutes. If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
      text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
    });
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
}

