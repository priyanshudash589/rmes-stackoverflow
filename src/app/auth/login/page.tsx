/**
 * Login Page - Email OTP Authentication
 * 
 * This page implements the email OTP authentication flow:
 * 1. User enters email address
 * 2. System sends 6-digit OTP code via email
 * 3. User enters OTP code to verify
 * 4. For new users, name is collected
 * 5. Session is created and user is redirected
 * 
 * This is the only authentication method - no passwords required.
 */
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Step = "email" | "otp" | "name";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send code");
        return;
      }

      setIsNewUser(data.isNewUser);
      setStep("otp");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, name: isNewUser ? name : undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresName) {
          setStep("name");
          return;
        }
        setError(data.error || "Verification failed");
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSetName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setIsNewUser(true);
    setStep("otp");
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {step === "email" && "Sign in to Q&A"}
            {step === "otp" && "Enter verification code"}
            {step === "name" && "Complete your profile"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {step === "email" && "We'll send you a verification code"}
            {step === "otp" && `Code sent to ${email}`}
            {step === "name" && "Just one more step"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
                className="input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Sending..." : "Continue"}
            </button>
          </form>
        )}

        {step === "name" && (
          <form onSubmit={handleSetName} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Your name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                autoFocus
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Continue
            </button>
            <button
              type="button"
              onClick={() => setStep("email")}
              className="btn-ghost w-full"
            >
              Back
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {isNewUser && (
              <div>
                <label
                  htmlFor="name-otp"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Your name
                </label>
                <input
                  type="text"
                  id="name-otp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="input mb-4"
                />
              </div>
            )}
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Verification code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                required
                autoFocus
                maxLength={6}
                className="input text-center text-2xl tracking-[0.5em] font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn-primary w-full"
            >
              {loading ? "Verifying..." : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
              className="btn-ghost w-full"
            >
              Use different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

