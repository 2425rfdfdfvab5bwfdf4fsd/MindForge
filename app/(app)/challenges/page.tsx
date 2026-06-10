"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { ChallengeCard, type ChallengeData } from "@/components/forge/ChallengeCard";

type Tab = "available" | "active" | "completed";

export default function ChallengesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("available");
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const utils = api.useUtils();

  const { data: challenges = [], isLoading } = api.challenges.list.useQuery(undefined, {
    retry: false,
  });

  const { data: profile } = api.user.getProfile.useQuery(undefined, { retry: false });
  const isFree = !profile || profile.tier === "free";

  const activate = api.challenges.activate.useMutation({
    onMutate: (vars) => setActivatingId(vars.challengeId),
    onSuccess: () => {
      utils.challenges.list.invalidate();
      setActivatingId(null);
      showToast("Challenge started. No excuses.", "success");
    },
    onError: (err) => {
      setActivatingId(null);
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.upgradeRequired) {
          showToast("Upgrade to Pro to unlock this challenge.", "error");
          return;
        }
      } catch {}
      showToast(err.message || "Could not start challenge.", "error");
    },
  });

  const complete = api.challenges.complete.useMutation({
    onSuccess: (data) => {
      utils.challenges.list.invalidate();
      showToast(`+${data.xpAwarded} XP earned. Well done.`, "success");
    },
    onError: (err) => {
      showToast(err.message || "Could not complete challenge.", "error");
    },
  });

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  const available = challenges.filter(
    (c) => !c.userChallenge || c.userChallenge.status === "failed"
  );
  const active = challenges.filter((c) => c.userChallenge?.status === "active");
  const completed = challenges.filter((c) => c.userChallenge?.status === "completed");

  const tabCounts = { available: available.length, active: active.length, completed: completed.length };

  const displayed: ChallengeData[] =
    activeTab === "available"
      ? available
      : activeTab === "active"
      ? active
      : completed;

  const TABS: { key: Tab; label: string }[] = [
    { key: "available", label: "Available" },
    { key: "active", label: "My Active" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-text-primary">
          Callousing Challenges
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Intentional discomfort. This is how you build the mind.
        </p>
      </div>

      {/* Free tier notice */}
      {isFree && (
        <div className="mb-6 border border-forge-orange/30 bg-[#1A0A04] px-5 py-4">
          <p className="text-sm font-medium text-text-primary">
            Free plan — difficulty 1 challenges only.
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Upgrade to Pro to unlock the full challenge library.
          </p>
          <button className="mt-3 border border-forge-orange px-4 py-1.5 text-xs font-bold text-forge-orange hover:bg-forge-orange hover:text-forge-base transition-colors">
            Upgrade to Pro →
          </button>
        </div>
      )}

      {/* 1-active-at-a-time notice */}
      {active.length > 0 && activeTab === "available" && (
        <div
          className="mb-6 px-4 py-3 text-sm text-text-secondary border"
          style={{ borderColor: "#FF6B2B", background: "rgba(255,107,43,0.06)" }}
        >
          You have an active challenge. Complete or let it expire before starting a new one.
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex overflow-x-auto border-b border-forge-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="relative px-4 sm:px-5 py-2.5 min-h-[44px] text-sm font-bold transition-colors shrink-0 whitespace-nowrap"
            style={{
              color: activeTab === tab.key ? "#EDEDEF" : "#87857F",
              borderBottom: activeTab === tab.key ? "2px solid #FF6B2B" : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {tab.label}
            {tabCounts[tab.key] > 0 && (
              <span
                className="ml-2 text-xs px-1.5 py-0.5 font-mono"
                style={{
                  background:
                    activeTab === tab.key
                      ? "rgba(255,107,43,0.15)"
                      : "rgba(255,255,255,0.06)",
                  color: activeTab === tab.key ? "#FF6B2B" : "#87857F",
                }}
              >
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-52 animate-pulse bg-forge-elevated border border-forge-border"
            />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-20 text-center">
          <Zap size={44} className="mx-auto mb-4 text-forge-orange opacity-30" />
          {activeTab === "available" && (
            <>
              <p className="font-heading text-lg font-bold text-text-primary mb-1">
                No challenges available
              </p>
              <p className="text-sm text-text-muted">
                Check back soon — or upgrade to unlock more.
              </p>
            </>
          )}
          {activeTab === "active" && (
            <>
              <p className="font-heading text-lg font-bold text-text-primary mb-1">
                No active challenge
              </p>
              <p className="text-sm text-text-muted">
                Pick one from Available and start building your mind.
              </p>
              <button
                onClick={() => setActiveTab("available")}
                className="mt-4 px-5 py-2 text-sm font-bold text-white"
                style={{ background: "#FF6B2B" }}
              >
                Browse Challenges
              </button>
            </>
          )}
          {activeTab === "completed" && (
            <>
              <p className="font-heading text-lg font-bold text-text-primary mb-1">
                No completed challenges yet
              </p>
              <p className="text-sm text-text-muted">
                The work starts the moment you do.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((c) => (
            <ChallengeCard
              key={c.id + (c.userChallenge?.id ?? "")}
              challenge={c}
              isFree={isFree}
              onActivate={(id) => activate.mutate({ challengeId: id })}
              onComplete={(ucId, reflection) =>
                complete.mutate({
                  userChallengeId: ucId,
                  reflection,
                })
              }
              isActivating={activatingId === c.id && activate.isPending}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 max-w-sm px-5 py-3 text-sm font-medium shadow-lg"
          style={{
            background: toast.type === "success" ? "#1A2A1A" : "#2A1A1A",
            border: `1px solid ${toast.type === "success" ? "#22C55E" : "#EF4444"}`,
            color: toast.type === "success" ? "#86EFAC" : "#FCA5A5",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
