"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { RuleForty } from "@/components/forge/RuleForty";
import { api } from "@/lib/trpc/client";

interface AppShellClientProps {
  children: React.ReactNode;
  score: number;
  level: number;
  avatarUrl?: string | null;
  displayName?: string | null;
  userTier: "free" | "pro" | "elite";
}

export function AppShellClient({
  children,
  score: initialScore,
  level: initialLevel,
  avatarUrl,
  displayName,
  userTier,
}: AppShellClientProps) {
  const [ruleFortyOpen, setRuleFortyOpen] = useState(false);

  // Re-fetch profile in the client so the header score/level stays current
  // after XP-awarding mutations (habit completions, check-ins, etc.).
  // staleTime prevents hammering the server on every re-render.
  const { data: liveProfile } = api.user.getProfile.useQuery(undefined, {
    staleTime: 15_000,
  });

  const liveScore = liveProfile?.forgeScore ?? initialScore;
  const liveLevel = liveProfile?.level ?? initialLevel;

  return (
    <>
      <Sidebar
        userTier={userTier}
        onFortyPercent={() => setRuleFortyOpen(true)}
      />

      <div className="flex min-h-screen flex-col lg:pl-[240px]">
        <Header
          score={liveScore}
          level={liveLevel}
          avatarUrl={avatarUrl}
          displayName={displayName}
        />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      <RuleForty
        open={ruleFortyOpen}
        onClose={() => setRuleFortyOpen(false)}
        triggeredBy="manual"
      />
    </>
  );
}
