"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, BookOpen, Cookie, Settings, type LucideIcon } from "lucide-react";

const MOBILE_ITEMS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Habits", href: "/habits", icon: CheckSquare },
  { label: "Mirror", href: "/checkin", icon: BookOpen },
  { label: "Cookie Jar", href: "/cookie-jar", icon: Cookie },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex border-t border-forge-border bg-forge-subtle lg:hidden"
      style={{
        zIndex: 40,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {MOBILE_ITEMS.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center gap-1 py-3 transition-colors"
            style={{ color: isActive ? "#FF6B2B" : "#87857F" }}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
