import { Sidebar, MobileTopBar, MobileBottomNav } from "@/components/layout/sidebar";

// Reads Clerk session -> server-blocked while adopting Cache Components.
export const instant = false;

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileTopBar />
      <div className="pb-20 lg:pb-0 lg:pl-60">
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
