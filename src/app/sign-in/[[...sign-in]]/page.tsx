import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import { ModeToggle } from "@/components/mode-toggle";
import { AuthPanel } from "@/components/auth-panel";

export default function SignInPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <AuthPanel variant="signin" />

      <div className="relative flex items-center justify-center overflow-hidden bg-background p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_0%,var(--primary)/8%,transparent_70%)]"
        />
        <div className="absolute right-4 top-4">
          <ModeToggle />
        </div>
        <Suspense
          fallback={<div className="h-96 w-full max-w-sm animate-pulse rounded-xl bg-muted" />}
        >
          <SignIn fallbackRedirectUrl="/dashboard" signUpUrl="/sign-up" />
        </Suspense>
      </div>
    </main>
  );
}
