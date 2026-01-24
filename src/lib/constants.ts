export const PREDEFINED_TAGS = [
  "engineering",
  "product",
  "design",
  "devops",
  "security",
  "frontend",
  "backend",
  "mobile",
  "data",
  "infrastructure",
  "onboarding",
  "processes",
  "tooling",
  "documentation",
  "general",
] as const;

export type PredefinedTag = (typeof PREDEFINED_TAGS)[number];

export const VALIDATION = {
  TITLE_MIN: 5,
  TITLE_MAX: 150,
  DESCRIPTION_MAX: 10000,
  ANSWER_MAX: 10000,
  COMMENT_MAX: 1000,
  TAGS_MIN: 2,
  TAGS_MAX: 4,
} as const;

/**
 * OTP (One-Time Password) Configuration
 * 
 * Email OTP is the primary authentication method for this application.
 * These constants control the OTP generation, validation, and rate limiting.
 */
export const OTP = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  MAX_ATTEMPTS: 3,
  RATE_LIMIT_MINUTES: 1,
} as const;

export const SESSION = {
  EXPIRY_DAYS: 7,
  COOKIE_NAME: "session_token",
} as const;

