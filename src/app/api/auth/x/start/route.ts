import { auth } from "@clerk/nextjs/server";
import { codeChallenge, codeVerifier, oauthState, packCookie, appUrl, OAUTH_COOKIE } from "@/lib/oauth";

const X_SCOPES = "tweet.read users.read tweet.offline.create offline.access";

// GET /api/auth/x/start — redirect the user to X's authorization screen
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const verifier = codeVerifier();
  const state = oauthState();
  const redirectUri = `${appUrl(req)}/api/auth/x/callback`;

  const authorizeUrl = new URL("https://x.com/i/oauth2/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", process.env.X_CLIENT_ID!);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", X_SCOPES);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge(verifier));
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const res = Response.redirect(authorizeUrl);
  res.headers.set(
    "set-cookie",
    `${OAUTH_COOKIE}=${packCookie({ verifier, state, provider: "x" })}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
  );
  return res;
}
