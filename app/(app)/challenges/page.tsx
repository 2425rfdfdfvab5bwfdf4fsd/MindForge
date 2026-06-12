"use client";

import { useState, useRef, useEffect } from "react";
import { Zap, ChevronRight, CheckCircle2, Flame, Trophy, Lock, Target } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/trpc/client";
import { ChallengeCard, type ChallengeData } from "@/components/forge/ChallengeCard";

type Tab = "available" | "active" | "completed";

const TIPS = [
  "One active challenge at a time. Depth over breadth.",
  "Discomfort is the price of entry. Pay it willingly.",
  "Your mind quits at 40%. Your body still has 60% left.",
  "The challenge doesn't get easier. You get harder.",
];

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Initiate", 2: "Forged", 3: "Hardened", 4: "Elite", 5: "Savage",
};

export default function ChallengesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("available");
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [tipIdx] = useState(() => Math.floor(Math.random() * TIPS.length));
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const utils = api.useUtils();

  const { data: challenges = [], isLoading, isError: listError } = api.challenges.list.useQuery(undefined, { retry: false });
  const { data: profile } = api.user.getProfile.useQuery(undefined, { retry: false });
  const isFree = !profile || profile.tier === "free";

  const activate = api.challenges.activate.useMutation({
    onMutate: (vars) => setActivatingId(vars.challengeId),
    onSuccess: () => {
      utils.challenges.list.invalidate();
      setActivatingId(null);
      setActiveTab("active");
      showToast("Challenge started. No excuses.", "success");
    },
    onError: (err) => {
      setActivatingId(null);
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.upgradeRequired) { showToast("Upgrade to Pro to unlock this challenge.", "error"); return; }
      } catch {}
      showToast(err.message || "Could not start challenge.", "error");
    },
  });

  const complete = api.challenges.complete.useMutation({
    onMutate: (vars) => setCompletingId(vars.userChallengeId),
    onSuccess: (data) => {
      utils.challenges.list.invalidate();
      setCompletingId(null);
      showToast(`+${data.xpAwarded} XP earned. Well done.`, "success");
    },
    onError: (err) => {
      setCompletingId(null);
      showToast(err.message || "Could not complete challenge.", "error");
    },
  });

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  function showToast(message: string, type: "success" | "error") {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }

  const available  = challenges.filter((c) => !c.userChallenge || c.userChallenge.status === "failed");
  const active     = challenges.filter((c) => c.userChallenge?.status === "active");
  const completed  = challenges.filter((c) => c.userChallenge?.status === "completed");

  const tabCounts: Record<Tab, number> = { available: available.length, active: active.length, completed: completed.length };

  const displayed: ChallengeData[] =
    activeTab === "available" ? available :
    activeTab === "active"    ? active    :
    completed;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "available", label: "Available", icon: <Zap className="h-3.5 w-3.5" /> },
    { key: "active",    label: "Active",    icon: <Flame className="h-3.5 w-3.5" /> },
    { key: "completed", label: "Completed", icon: <Trophy className="h-3.5 w-3.5" /> },
  ];

  // XP total from completed
  const totalXpEarned = challenges
    .filter(c => c.userChallenge?.status === "completed")
    .reduce((sum, c) => sum + c.xpReward, 0);

  return (
    <>
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-14 py-8 sm:py-10 lg:py-12">
        <div className="mx-auto max-w-[1400px]">

          {/* ── Page header ──────────────────────────────────────────────── */}
          <div className="mb-8 lg:mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-forge-orange" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-forge-orange">
                Callousing Challenges
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-text-primary leading-tight">
                  Build the Mind
                </h1>
                <p className="mt-1 text-sm text-text-muted">
                  Intentional discomfort. One at a time. No shortcuts.
                </p>
              </div>
              {active.length > 0 && (
                <div className="flex items-center gap-2 shrink-0 border border-forge-orange/30 bg-forge-orange/5 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-forge-orange animate-pulse" />
                  <span className="text-xs font-bold text-forge-orange">Challenge in progress</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Two-column grid ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px] 2xl:grid-cols-[1fr_340px] gap-6 lg:gap-8 2xl:gap-10 items-start">

            {/* ── LEFT: Tabs + cards ───────────────────────────────────── */}
            <div className="min-w-0 space-y-5">

              {/* Free tier notice */}
              {isFree && (
                <div className="border border-forge-orange/30 bg-[#1C0E06] flex items-start gap-4 px-5 py-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-forge-orange/20 bg-forge-orange/10">
                    <Lock className="h-3.5 w-3.5 text-forge-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">Free plan — difficulty 1 only</p>
                    <p className="mt-0.5 text-xs text-text-muted leading-relaxed">
                      Upgrade to Pro to unlock the full challenge library across all difficulty levels.
                    </p>
                  </div>
                  <Link
                    href="/upgrade"
                    className="shrink-0 border border-forge-orange px-3 py-1.5 text-xs font-bold text-forge-orange hover:bg-forge-orange hover:text-forge-base transition-colors"
                  >
                    Upgrade →
                  </Link>
                </div>
              )}

              {/* 1-active-at-a-time banner */}
              {active.length > 0 && activeTab === "available" && (
                <div className="flex items-start gap-3 border border-forge-border bg-forge-elevated px-4 py-3">
                  <Flame className="h-4 w-4 shrink-0 text-forge-orange mt-0.5" />
                  <p className="text-sm text-text-secondary leading-relaxed">
                    You have an active challenge running. Finish it before starting a new one.{" "}
                    <button
                      onClick={() => setActiveTab("active")}
                      className="text-forge-orange hover:text-forge-orange-hover underline underline-offset-2 transition-colors"
                    >
                      View active
                    </button>
                  </p>
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-forge-border overflow-x-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="relative flex items-center gap-2 px-4 sm:px-5 py-3 min-h-[48px] text-sm font-bold transition-colors shrink-0 whitespace-nowrap"
                    style={{
                      color: activeTab === tab.key ? "#EDEDEF" : "#87857F",
                      borderBottom: activeTab === tab.key ? "2px solid #FF6B2B" : "2px solid transparent",
                      marginBottom: "-1px",
                    }}
                  >
                    <span style={{ color: activeTab === tab.key ? "#FF6B2B" : "#4A4845" }}>
                      {tab.icon}
                    </span>
                    {tab.label}
                    {tabCounts[tab.key] > 0 && (
                      <span
                        className="text-xs px-1.5 py-0.5 font-mono"
                        style={{
                          background: activeTab === tab.key ? "rgba(255,107,43,0.15)" : "rgba(255,255,255,0.05)",
                          color: activeTab === tab.key ? "#FF6B2B" : "#4A4845",
                        }}
                      >
                        {tabCounts[tab.key]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Cards */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-[180px] animate-pulse bg-forge-elevated border border-forge-border" />
                  ))}
                </div>
              ) : listError ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border border-forge-border bg-forge-elevated py-20 text-center"
                >
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center border border-red-800/30 bg-red-950/20">
                    <Target className="h-7 w-7 text-red-400 opacity-60" />
                  </div>
                  <p className="font-heading text-lg font-bold text-text-primary mb-2">
                    Failed to load challenges
                  </p>
                  <p className="text-sm text-text-muted mb-5 max-w-xs mx-auto leading-relaxed">
                    Something went wrong. Check your connection and try again.
                  </p>
                  <button
                    onClick={() => utils.challenges.list.invalidate()}
                    className="inline-flex items-center gap-2 border border-forge-border px-5 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:border-forge-border-strong transition-colors"
                  >
                    Retry
                  </button>
                </motion.div>
              ) : displayed.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border border-forge-border bg-forge-elevated py-20 text-center"
                >
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center border border-forge-orange/20 bg-forge-orange/5">
                    {activeTab === "completed"
                      ? <Trophy className="h-7 w-7 text-forge-orange opacity-40" />
                      : <Zap className="h-7 w-7 text-forge-orange opacity-40" />
                    }
                  </div>
                  {activeTab === "available" && (
                    <>
                      <p className="font-heading text-lg font-bold text-text-primary mb-1">No challenges available</p>
                      <p className="text-sm text-text-muted">Check back soon — or upgrade to unlock more.</p>
                    </>
                  )}
                  {activeTab === "active" && (
                    <>
                      <p className="font-heading text-lg font-bold text-text-primary mb-2">No active challenge</p>
                      <p className="text-sm text-text-muted mb-5">Pick one and start building your mind.</p>
                      <button
                        onClick={() => setActiveTab("available")}
                        className="inline-flex items-center gap-2 bg-forge-orange px-5 py-2.5 text-sm font-bold text-forge-base hover:bg-forge-orange-hover transition-colors"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Browse Challenges
                      </button>
                    </>
                  )}
                  {activeTab === "completed" && (
                    <>
                      <p className="font-heading text-lg font-bold text-text-primary mb-1">No completed challenges yet</p>
                      <p className="text-sm text-text-muted">The work starts the moment you do.</p>
                    </>
                  )}
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3 2xl:gap-4">
                    {displayed.map((c, i) => (
                      <motion.div
                        key={c.id + (c.userChallenge?.id ?? "")}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.15, delay: i * 0.04 }}
                      >
                        <ChallengeCard
                          challenge={c}
                          isFree={isFree}
                          hasActiveChallenge={active.length > 0 && c.userChallenge?.status !== "active"}
                          onActivate={(id) => activate.mutate({ challengeId: id })}
                          onComplete={(ucId, reflection) => complete.mutate({ userChallengeId: ucId, reflection })}
                          isActivating={activatingId === c.id && activate.isPending}
                          isCompleting={completingId === c.userChallenge?.id && complete.isPending}
                        />
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>

            {/* ── RIGHT: Sidebar ───────────────────────────────────────── */}
            <div className="space-y-4 lg:sticky lg:top-6">

              {/* Progress stats */}
              <div className="border border-forge-border bg-forge-elevated">
                <div className="border-b border-forge-border px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Your Progress</span>
                </div>
                <div className="divide-y divide-forge-border">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Zap className="h-3.5 w-3.5 text-forge-orange" />
                      <span className="text-xs text-text-muted">Available</span>
                    </div>
                    <span className="font-heading text-sm font-bold text-text-primary">{available.length}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Flame className="h-3.5 w-3.5 text-forge-orange" />
                      <span className="text-xs text-text-muted">Active Now</span>
                    </div>
                    <span className="font-heading text-sm font-bold text-text-primary">{active.length}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Trophy className="h-3.5 w-3.5 text-forge-orange" />
                      <span className="text-xs text-text-muted">Completed</span>
                    </div>
                    <span className="font-heading text-sm font-bold text-text-primary">{completed.length}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-forge-orange" />
                      <span className="text-xs text-text-muted">XP Earned</span>
                    </div>
                    <span className="font-heading text-sm font-bold text-text-primary">{totalXpEarned}</span>
                  </div>
                </div>
              </div>

              {/* Difficulty legend */}
              <div className="border border-forge-border bg-forge-elevated">
                <div className="border-b border-forge-border px-4 py-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Difficulty Scale</span>
                </div>
                <div className="divide-y divide-forge-border">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div key={lvl} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-1.5 w-1 transition-colors"
                            style={{ background: i <= lvl ? "#FF6B2B" : "#2A2927" }} />
                        ))}
                      </div>
                      <span className="text-xs text-text-muted">{DIFFICULTY_LABELS[lvl]}</span>
                      {lvl > 1 && isFree && (
                        <Lock className="h-3 w-3 text-text-disabled" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tip card */}
              <div className="border border-forge-border/50 bg-forge-subtle px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-text-disabled mb-2">Mindset</p>
                <p className="text-xs leading-relaxed text-text-disabled italic">
                  &ldquo;{TIPS[tipIdx]}&rdquo;
                </p>
              </div>

              {/* Quick links */}
              <div className="border border-forge-border bg-forge-elevated divide-y divide-forge-border">
                {[
                  { href: "/checkin",    label: "Daily Mirror" },
                  { href: "/coach",      label: "AI Coach" },
                  { href: "/cookie-jar", label: "Cookie Jar" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between px-4 py-3 text-xs text-text-muted hover:text-text-primary hover:bg-forge-overlay transition-colors group"
                  >
                    <span>{label}</span>
                    <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm px-5 py-3 text-sm font-medium shadow-xl"
            style={{
              background: toast.type === "success" ? "#0F1F0F" : "#1F0F0F",
              border: `1px solid ${toast.type === "success" ? "#22C55E" : "#EF4444"}`,
              color: toast.type === "success" ? "#86EFAC" : "#FCA5A5",
            }}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === "success"
                ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                : <Zap className="h-4 w-4 shrink-0" />
              }
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
