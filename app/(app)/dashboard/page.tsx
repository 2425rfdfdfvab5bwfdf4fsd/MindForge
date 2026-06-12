"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/client";
import { ForgeScore } from "@/components/forge/ForgeScore";
import { XPBar } from "@/components/forge/XPBar";
import { HabitCard } from "@/components/forge/HabitCard";
import { RuleForty } from "@/components/forge/RuleForty";
import {
  SkeletonHabitCard,
  SkeletonForgeScore,
  SkeletonXPBar,
} from "@/components/forge/Skeletons";
import { getLevelFromXP } from "@/lib/gamification/level";

// Must match CHALLENGE_DEADLINE_FACTOR in server/trpc/routers/challenges.ts
const CHALLENGE_DEADLINE_FACTOR = 3;

function getLocalDate(timezone: string): string {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function CheckinCTA({ done }: { done: boolean }) {
  if (done) {
    return (
      <div className="border border-green-800/40 bg-[#0A1A0A] px-5 py-4">
        <p className="text-sm font-medium text-green-400">
          ✓ Mirror complete today
        </p>
      </div>
    );
  }
  return (
    <div
      className="bg-[#111110] p-5"
      style={{
        border: "1px solid #1A1918",
        borderLeft: "3px solid #FF6B2B",
      }}
    >
      <h3 className="font-heading text-xl font-bold text-text-primary">
        The Mirror is waiting — face it
      </h3>
      <p className="mt-1 text-sm text-text-muted">
        Daily reflection keeps your coach sharp.
      </p>
      <Link
        href="/checkin"
        className="mt-4 inline-block bg-forge-orange px-5 py-2 text-sm font-bold text-forge-base hover:bg-forge-orange-hover"
      >
        Open the Mirror →
      </Link>
    </div>
  );
}

function ActiveChallengeCard({
  challenge,
}: {
  challenge: {
    id: string;
    started_at: string | Date | null;
    challenges: { title: string; duration_minutes: number } | null;
  };
}) {
  if (!challenge.challenges || !challenge.started_at) return null;
  const started = new Date(challenge.started_at);
  const expiresAt = new Date(
    started.getTime() + challenge.challenges.duration_minutes * CHALLENGE_DEADLINE_FACTOR * 60 * 1000
  );
  const msLeft = Math.max(0, expiresAt.getTime() - Date.now());
  const daysLeft = Math.ceil(msLeft / 86400000);
  const hoursLeft = Math.ceil(msLeft / 3600000);
  const timeLabel =
    daysLeft >= 1 ? `${daysLeft}d remaining` : `${hoursLeft}h remaining`;

  return (
    <div className="border border-forge-border bg-forge-elevated p-4">
      <p className="mb-1 text-xs uppercase tracking-wider text-text-muted">
        Active Challenge
      </p>
      <p className="text-sm font-medium text-text-primary">
        {challenge.challenges.title}
      </p>
      <p className="mt-1 text-xs text-forge-orange">{timeLabel}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard content (data-dependent)
// ---------------------------------------------------------------------------

function DashboardContent() {
  const [ruleFortyOpen, setRuleFortyOpen] = useState(false);

  // Load profile first so we can use the user's actual timezone for the date.
  const { data: profile, isLoading: profileLoading } = api.user.getProfile.useQuery(
    undefined,
    { retry: false }
  );

  // Only compute localDate once profile is available; fall back to UTC so
  // TypeScript is happy but the query is gated by `enabled` below.
  const localDate = getLocalDate(profile?.timezone ?? "UTC");

  // Gate dashboard fetch on profile being ready — avoids a wrong-timezone
  // first fetch followed immediately by a second corrected one.
  const {
    data,
    isLoading: dashLoading,
    isError,
    refetch,
  } = api.dashboard.getAll.useQuery(
    { localDate },
    { retry: false, enabled: !!profile }
  );

  // Show skeleton while profile or dashboard data is still loading.
  if (profileLoading || dashLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <p className="text-2xl">⚠️</p>
        <p className="text-base font-medium text-text-secondary">
          Failed to load dashboard. Please try again.
        </p>
        <button
          onClick={() => refetch()}
          className="bg-forge-orange px-6 py-3 text-sm font-bold text-forge-base hover:bg-forge-orange-hover"
        >
          Retry
        </button>
      </div>
    );
  }

  const { habits, todayCheckin, activeChallenge, forgeScore, xp, level, recentCookieJar, todayXPDelta } = data;
  const levelInfo = getLevelFromXP(xp);

  return (
    <>
      <div className="mx-auto max-w-6xl 2xl:max-w-9xl px-4 sm:px-6 py-6 sm:py-8 2xl:py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl 2xl:text-4xl font-bold text-text-primary">
            {data.user?.display_name ? `Welcome back, ${data.user.display_name}` : "The Forge"}
          </h1>
          <p className="mt-1 text-sm 2xl:text-base text-text-muted">{formatDate(localDate)}</p>
        </div>

        {/* Mobile-only: Forge Score full-width above grid */}
        <div className="mb-6 block lg:hidden">
          <div className="border border-forge-border bg-forge-elevated p-6 text-center">
            <ForgeScore score={forgeScore} level={level} />
            {todayXPDelta !== 0 && (
              <p
                className={`mt-2 text-sm font-medium ${todayXPDelta > 0 ? "text-green-400" : "text-red-400"}`}
              >
                {todayXPDelta > 0 ? "+" : ""}
                {todayXPDelta} today
              </p>
            )}
            <div className="mt-4">
              <XPBar xp={xp} />
            </div>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 gap-6 2xl:gap-8 lg:grid-cols-3">
          {/* Left column — 2/3 */}
          <div className="space-y-6 2xl:space-y-8 lg:col-span-2">
            {/* Daily Mirror CTA */}
            <CheckinCTA done={!!todayCheckin} />

            {/* Today's Habits */}
            <div>
              <h2 className="mb-4 font-heading text-2xl 2xl:text-3xl font-bold text-text-primary">
                Today's Habits
              </h2>

              {habits.length === 0 ? (
                <div className="border border-forge-border bg-forge-elevated p-8 text-center">
                  <p className="mb-4 text-sm text-text-muted">
                    No habits scheduled for today.
                  </p>
                  <Link
                    href="/habits/new"
                    className="bg-forge-orange px-5 py-2.5 text-sm font-bold text-forge-base hover:bg-forge-orange-hover"
                  >
                    Add your first habit
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {habits.map((h) => (
                    <HabitCard
                      key={h.id}
                      habit={
                        h as typeof h & {
                          today_status: "pending" | "completed" | "missed";
                        }
                      }
                      localDate={localDate}
                      onUpdate={() => refetch()}
                      onFortyPercent={() => setRuleFortyOpen(true)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column — 1/3 */}
          <div className="space-y-5 2xl:space-y-6">
            {/* Desktop-only: Forge Score */}
            <div className="hidden lg:block">
              <div className="border border-forge-border bg-forge-elevated p-6 2xl:p-8 text-center">
                <ForgeScore score={forgeScore} level={level} />
                {todayXPDelta !== 0 && (
                  <p
                    className={`mt-2 text-sm 2xl:text-base font-medium ${todayXPDelta > 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {todayXPDelta > 0 ? "+" : ""}
                    {todayXPDelta} today
                  </p>
                )}
              </div>
            </div>

            {/* XP Bar — desktop only (shown in mobile block above) */}
            <div className="hidden lg:block">
              <div className="border border-forge-border bg-forge-elevated p-4 2xl:p-5">
                <XPBar xp={xp} />
                <div className="mt-3 flex justify-between text-xs 2xl:text-sm text-text-muted">
                  <span>Level {levelInfo.level}</span>
                  <span>{levelInfo.name}</span>
                </div>
              </div>
            </div>

            {/* Active challenge */}
            {activeChallenge && (
              <ActiveChallengeCard
                challenge={{
                  id: String(activeChallenge.id ?? ""),
                  started_at: activeChallenge.started_at ?? null,
                  challenges: activeChallenge.challenges
                    ? {
                        title: String(activeChallenge.challenges.title ?? ""),
                        duration_minutes: Number(activeChallenge.challenges.duration_minutes ?? 0),
                      }
                    : null,
                }}
              />
            )}

            {/* Recent Cookie Jar */}
            {recentCookieJar && recentCookieJar.length > 0 && (
              <div className="border border-forge-border bg-forge-elevated p-4 2xl:p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-text-muted">
                    Cookie Jar
                  </p>
                  <Link
                    href="/cookie-jar"
                    className="text-xs text-forge-orange hover:underline"
                  >
                    View all
                  </Link>
                </div>
                <div className="space-y-2">
                  {(recentCookieJar as Array<{ id: string; title: string }>).map(
                    (entry) => (
                      <p key={entry.id} className="text-sm text-text-muted">
                        {entry.title}
                      </p>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="border border-forge-border bg-forge-elevated p-4 2xl:p-5">
              <p className="mb-3 text-xs 2xl:text-sm uppercase tracking-wider text-text-muted">
                Quick Stats
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm 2xl:text-base">
                  <span className="text-text-muted">Total Habits</span>
                  <span className="tabular-nums text-text-primary">
                    {habits.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm 2xl:text-base">
                  <span className="text-text-muted">Done Today</span>
                  <span className="tabular-nums text-green-400">
                    {habits.filter((h) => h.today_status === "completed").length}
                  </span>
                </div>
                <div className="flex justify-between text-sm 2xl:text-base">
                  <span className="text-text-muted">Pending</span>
                  <span className="tabular-nums text-forge-orange">
                    {habits.filter((h) => h.today_status === "pending").length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 40% Rule modal — auto-triggered when a missed habit has a broken streak */}
      <RuleForty
        open={ruleFortyOpen}
        onClose={() => setRuleFortyOpen(false)}
        triggeredBy="auto_habit"
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl 2xl:max-w-9xl px-4 sm:px-6 py-6 sm:py-8 2xl:py-10">
      <div className="mb-8 space-y-2 animate-pulse">
        <div className="h-8 w-64 rounded bg-forge-border" />
        <div className="h-4 w-40 rounded bg-forge-border" />
      </div>

      {/* Mobile forge score skeleton */}
      <div className="mb-6 block lg:hidden">
        <div className="border border-forge-border bg-forge-elevated p-6">
          <SkeletonForgeScore />
          <div className="mt-4">
            <SkeletonXPBar />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 2xl:gap-8 lg:grid-cols-3">
        <div className="space-y-6 2xl:space-y-8 lg:col-span-2">
          <div className="h-24 animate-pulse bg-forge-elevated" />
          <div className="space-y-3">
            <div className="mb-4 h-7 w-40 animate-pulse rounded bg-forge-border" />
            <SkeletonHabitCard />
            <SkeletonHabitCard />
            <SkeletonHabitCard />
          </div>
        </div>
        <div className="hidden space-y-5 lg:block">
          <div className="border border-forge-border bg-forge-elevated p-6">
            <SkeletonForgeScore />
          </div>
          <div className="border border-forge-border bg-forge-elevated p-4">
            <SkeletonXPBar />
          </div>
          <div className="h-24 animate-pulse border border-forge-border bg-forge-elevated" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
