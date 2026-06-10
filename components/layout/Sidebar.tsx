"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  Brain,
  Cookie,
  Zap,
  BarChart2,
  Settings,
  Flame,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Habits", href: "/habits", icon: CheckSquare },
  { label: "Daily Mirror", href: "/checkin", icon: BookOpen },
  { label: "AI Coach", href: "/coach", icon: Brain },
  { label: "Cookie Jar", href: "/cookie-jar", icon: Cookie },
  { label: "Challenges", href: "/challenges", icon: Zap },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  userTier?: "free" | "pro" | "elite";
  onFortyPercent?: () => void;
}

export function Sidebar({ userTier = "free", onFortyPercent }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 hidden h-full w-[240px] flex-col border-r border-forge-border bg-forge-subtle lg:flex"
      style={{ zIndex: 40 }}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-forge-border px-4">
        <span className="font-heading text-lg font-bold text-forge-orange">
          MindForge
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map(({ label, href, icon: Icon, badge }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const showProBadge = label === "AI Coach" && userTier === "free";

          return (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-none px-4 py-3 transition-all"
              style={{
                borderLeft: `2px solid ${isActive ? "#FF6B2B" : "transparent"}`,
                background: isActive ? "#1A1918" : "transparent",
                color: isActive ? "#EDEDEF" : "#87857F",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "#1A1918";
                  e.currentTarget.style.color = "#EDEDEF";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#87857F";
                }
              }}
            >
              <Icon size={18} />
              <span className="flex-1 text-sm font-medium">{label}</span>
              {showProBadge && (
                <span className="rounded-full bg-forge-orange px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-forge-base">
                  Pro
                </span>
              )}
              {badge && !showProBadge && (
                <span className="rounded-full bg-forge-elevated px-2 py-0.5 text-[10px] text-text-muted">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 40% Rule button */}
      <div className="border-t border-forge-border px-2 py-3">
        <button
          onClick={onFortyPercent}
          className="flex w-full items-center gap-3 rounded-none px-4 py-3 text-forge-orange transition-all hover:bg-forge-elevated"
        >
          <Flame size={18} />
          <span className="text-sm font-medium">40% Rule</span>
        </button>
      </div>
    </aside>
  );
}
