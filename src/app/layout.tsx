import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "PostPulse", template: "%s · PostPulse" },
  description:
    "Plan, enhance with AI, and auto-publish content to X and LinkedIn — the micro content scheduler for creators.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClerkProvider appearance={{ theme: shadcn }}>
            {children}
            <Toaster />
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
