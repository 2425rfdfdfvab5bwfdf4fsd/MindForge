"use client";

import { usePathname } from "next/navigation";
import { ForgeScore } from "@/components/forge/ForgeScore";

const PATH_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/habits": "Habits",
  "/checkin": "Daily Mirror",
  "/coach": "AI Coach",
  "/cookie-jar": "Cookie Jar",
  "/challenges": "Challenges",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/upgrade": "Upgrade",
};

interface HeaderProps {
  score?: number;
  level?: number;
  avatarUrl?: string | null;
  displayName?: string | null;
  title?: string;
}

export function Header({
  score = 0,
  level = 1,
  avatarUrl,
  displayName,
  title,
}: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = title ?? PATH_TITLES[pathname] ?? "MindForge";

  const initials = displayName
    ? displayName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <header className="flex h-14 items-center justify-between border-b border-forge-border bg-forge-subtle px-4 lg:px-6">
      {/* Page title */}
      <h1 className="font-heading text-lg font-semibold text-text-primary">
        {pageTitle}
      </h1>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <ForgeScore score={score} level={level} compact />

        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-forge-overlay text-xs font-semibold text-text-secondary">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName ?? "Avatar"} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
      </div>
    </header>
  );
}
