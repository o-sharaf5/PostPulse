import { auth } from "@clerk/nextjs/server";
import { oauthState, packCookie, appUrl, OAUTH_COOKIE } from "@/lib/oauth";

const LI_SCOPES = "openid profile w_member_social";

// GET /api/auth/linkedin/start — redirect to LinkedIn's authorization screen
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const state = oauthState();
  const authorizeUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", process.env.LINKEDIN_CLIENT_ID!);
  authorizeUrl.searchParams.set("redirect_uri", `${appUrl(req)}/api/auth/linkedin/callback`);
  authorizeUrl.searchParams.set("scope", LI_SCOPES);
  authorizeUrl.searchParams.set("state", state);

  const res = Response.redirect(authorizeUrl);
  res.headers.set(
    "set-cookie",
    `${OAUTH_COOKIE}=${packCookie({ verifier: "none", state, provider: "linkedin" })}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
  );
  return res;
}
