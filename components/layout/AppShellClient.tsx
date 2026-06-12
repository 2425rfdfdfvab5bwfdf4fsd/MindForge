"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { RuleForty } from "@/components/forge/RuleForty";

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
  score,
  level,
  avatarUrl,
  displayName,
  userTier,
}: AppShellClientProps) {
  const [ruleFortyOpen, setRuleFortyOpen] = useState(false);

  return (
    <>
      <Sidebar
        userTier={userTier}
        onFortyPercent={() => setRuleFortyOpen(true)}
      />

      <div className="flex min-h-screen flex-col lg:pl-[240px]">
        <Header
          score={score}
          level={level}
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
