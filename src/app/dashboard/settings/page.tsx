import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AccountDTO } from "@/lib/types";
import { AccountsManager } from "@/components/settings/accounts-manager";
import { IdeasPanel } from "@/components/settings/ideas-panel";

export const instant = false;

export default async function SettingsPage() {
  const guard = await requireUser();
  if (!guard.ok) redirect("/sign-in");

  const accounts = await prisma.socialAccount.findMany({
    where: { clerkUserId: guard.userId },
    orderBy: { createdAt: "asc" },
  });

  const dtos: AccountDTO[] = accounts.map((a) => ({
    id: a.id,
    platform: a.platform,
    displayName: a.displayName,
    handle: a.handle,
  }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <AccountsManager accounts={dtos} />
      <IdeasPanel />
    </div>
  );
}
