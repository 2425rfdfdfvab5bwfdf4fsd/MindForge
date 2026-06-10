"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initPostHog, captureEvent } from "@/lib/posthog/client";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    captureEvent("$pageview", { path: pathname });
  }, [pathname]);

  return <>{children}</>;
}
