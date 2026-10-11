"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Inbox,
  ListFilter,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Brand } from "@/components/brand";
import { ModeToggle } from "@/components/mode-toggle";
import { UserButton } from "@clerk/nextjs";

const NAV = [
  { href: "/dashboard", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/posts", label: "Posts", icon: ListFilter },
  { href: "/dashboard/queue", label: "Queue", icon: Inbox },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar lg:flex">
      <div className="flex h-16 items-center border-b px-5">
        <Brand href="/dashboard" />
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-3 border-t p-3">
        <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <Sparkles className="size-4 shrink-0 text-primary" />
          <span>AI enhance uses gpt‑4o‑mini. 30 calls/hour.</span>
        </div>
        <div className="flex items-center justify-between px-1">
          <UserButton />
          <ModeToggle />
        </div>
      </div>
    </aside>
  );
}

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur lg:hidden">
      <Brand href="/dashboard" />
      <div className="flex items-center gap-1">
        <ModeToggle />
        <UserButton />
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background/95 backdrop-blur lg:hidden">
      {NAV.map((item) => {
        const active =
          item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="size-4.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
