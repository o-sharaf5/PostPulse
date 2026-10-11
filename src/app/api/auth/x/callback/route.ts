import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { appUrl, OAUTH_COOKIE, unpackCookie } from "@/lib/oauth";

// GET /api/auth/x/callback — exchange the code, fetch the user, store the account
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookie = req.headers.get("cookie")?.match(/(?:^|;\s*)postpulse_oauth=([^;]+)/)?.[1];
  const packed = cookie ? unpackCookie(cookie) : null;
  if (!code || !state || packed?.provider !== "x" || packed.state !== state) {
    return Response.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

  const redirectUri = `${appUrl(req)}/api/auth/x/callback`;
  const basic = Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString("base64");

  const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: packed.verifier,
    }),
  });
  if (!tokenRes.ok) {
    return Response.json({ error: `X token exchange failed (${tokenRes.status})` }, { status: 502 });
  }
  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const meRes = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url", {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });
  if (!meRes.ok) {
    return Response.json({ error: `X users/me failed (${meRes.status})` }, { status: 502 });
  }
  const me = (await meRes.json()) as {
    data: { id: string; name: string; username: string; profile_image_url?: string };
  };

  const account = await prisma.socialAccount.upsert({
    where: {
      clerkUserId_platform_externalId: {
        clerkUserId: userId,
        platform: "X",
        externalId: me.data.id,
      },
    },
    update: {
      accessTokenEnc: encrypt(tokens.access_token),
      refreshTokenEnc: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      tokenExpiresAt: new Date(Date.now() + (tokens.expires_in ?? 7200) * 1000),
      displayName: me.data.name,
      handle: `@${me.data.username}`,
      pictureUrl: me.data.profile_image_url ?? null,
    },
    create: {
      clerkUserId: userId,
      platform: "X",
      externalId: me.data.id,
      displayName: me.data.name,
      handle: `@${me.data.username}`,
      pictureUrl: me.data.profile_image_url ?? null,
      accessTokenEnc: encrypt(tokens.access_token),
      refreshTokenEnc: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      tokenExpiresAt: new Date(Date.now() + (tokens.expires_in ?? 7200) * 1000),
    },
  });

  const res = Response.redirect(`${appUrl(req)}/dashboard/settings?connected=x-${account.id}`);
  res.headers.set("set-cookie", `${OAUTH_COOKIE}=; Path=/; Max-Age=0`);
  return res;
}
