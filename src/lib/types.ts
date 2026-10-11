import type { Platform, PostStatus, PublishStatus } from "@prisma/client";

/** JSON-safe post shape passed from server components to the client app. */
export type PostDTO = {
  id: string;
  content: string;
  status: PostStatus;
  scheduledAt: string | null; // ISO
  publishedAt: string | null; // ISO
  timezone: string;
  jobs: {
    platform: Platform;
    status: PublishStatus;
    externalPostId: string | null;
    error: string | null;
  }[];
};

export type AccountDTO = {
  id: string;
  platform: Platform;
  displayName: string;
  handle: string | null;
};

export const PLATFORM_LABEL: Record<Platform, string> = {
  X: "X",
  LINKEDIN: "LinkedIn",
  MOCK: "Demo",
};

export const STATUS_STYLE: Record<PostStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border",
  SCHEDULED: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  PUBLISHING: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  PUBLISHED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
  CANCELED: "bg-muted text-muted-foreground border line-through",
};

export const STATUS_DOT: Record<PostStatus, string> = {
  DRAFT: "bg-muted-foreground/50",
  SCHEDULED: "bg-blue-500",
  PUBLISHING: "bg-amber-500 animate-pulse",
  PUBLISHED: "bg-emerald-500",
  FAILED: "bg-red-500",
  CANCELED: "bg-muted-foreground/30",
};
