import type { Platform, SocialAccount } from "@prisma/client";
import { decrypt, encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { publishToX } from "./x";
import { publishToLinkedIn } from "./linkedin";

/**
 * Returns a valid access token, refreshing + persisting it when within
 * 5 minutes of expiry. Throws on refresh failure (job will record the error).
 */
async function getFreshToken(account: SocialAccount): Promise<string> {
  const stored = decrypt(account.accessTokenEnc);
  const soon = Date.now() + 5 * 60_000;

  if (!account.tokenExpiresAt || account.tokenExpiresAt.getTime() > soon) {
    return stored;
  }
  if (!account.refreshTokenEnc) {
    throw new Error(`Token expired for ${account.platform} account and cannot be refreshed`);
  }

  const refreshToken = decrypt(account.refreshTokenEnc);
  const tokens = await refreshTokens(account.platform, refreshToken);

  await prisma.socialAccount.update({
    where: { id: account.id },
    data: {
      accessTokenEnc: encrypt(tokens.accessToken),
      ...(tokens.refreshToken ? { refreshTokenEnc: encrypt(tokens.refreshToken) } : {}),
      tokenExpiresAt: new Date(Date.now() + tokens.expiresInSeconds * 1000),
    },
  });
  return tokens.accessToken;
}

async function refreshTokens(
  platform: Platform,
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresInSeconds: number }> {
  if (platform === "X") {
    const res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.X_CLIENT_ID!,
      }),
    });
    if (!res.ok) throw new Error(`X token refresh ${res.status}: ${await res.text()}`);
    const j = await res.json();
    return {
      accessToken: j.access_token,
      refreshToken: j.refresh_token, // X rotates refresh tokens
      expiresInSeconds: j.expires_in ?? 7200,
    };
  }
  if (platform === "LINKEDIN") {
    const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.LINKEDIN_CLIENT_ID!,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
      }),
    });
    if (!res.ok) throw new Error(`LinkedIn token refresh ${res.status}: ${await res.text()}`);
    const j = await res.json();
    return { accessToken: j.access_token, expiresInSeconds: j.expires_in ?? 5184000 };
  }
  // MOCK accounts hold a static fake token
  return { accessToken: refreshToken || "mock", expiresInSeconds: 3600 };
}

export async function publishToPlatform(
  platform: Platform,
  account: SocialAccount,
  content: string,
): Promise<string> {
  const accessToken = await getFreshToken(account);

  switch (platform) {
    case "X":
      return publishToX(accessToken, content);
    case "LINKEDIN":
      return publishToLinkedIn(accessToken, account.externalId, content);
    case "MOCK":
      await new Promise((r) => setTimeout(r, 300)); // simulate network latency
      return `mock-${crypto.randomUUID()}`;
  }
}
