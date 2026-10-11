import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk7 + Next 16 Cache Components: `auth.protect()` in middleware rewrites to
// the sign-in page, which 404s on Vercel. Auth is enforced per-route instead:
// pages call requireUser() and API routes return 401. Middleware only syncs the session.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files; run on everything else.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    // Clerk's auto-proxy path (required by the Clerk CLI/proxy flow).
    "/__clerk/:path*",
  ],
};
