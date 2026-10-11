import crypto from "node:crypto";

/**
 * PKCE helpers for the X (Twitter) OAuth 2.0 user-context flow.
 * Verifier + state live in a short-lived httpOnly cookie between
 * /start and /callback — no server-side session needed on Vercel.
 */

export function codeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function codeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export function oauthState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export const OAUTH_COOKIE = "postpulse_oauth";

export function packCookie(value: {
  verifier: string;
  state: string;
  provider: "x" | "linkedin";
}): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function unpackCookie(raw: string): {
  verifier: string;
  state: string;
  provider: "x" | "linkedin";
} | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.state !== "string" || typeof parsed?.provider !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function appUrl(req: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
}
