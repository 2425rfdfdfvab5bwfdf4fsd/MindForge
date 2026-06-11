"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Flame, CheckCircle2, Circle, XCircle, Zap, Target, LayoutGrid } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { HabitCard } from "@/components/forge/HabitCard";

function getLocalDate(timezone: string): string {
  try {
    return new Date().toLocaleDateString("en-CA", { timeZone: timezone });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

const CATEGORY_FILTERS = [
  { id: "all",     label: "All" },
  { id: "health",  label: "Health" },
  { id: "mind",    label: "Mind" },
  { id: "avoid",   label: "Avoid" },
  { id: "perform", label: "Perform" },
] as const;

type CategoryFilter = (typeof CATEGORY_FILTERS)[number]["id"];

const CATEGORY_ACCENT: Record<string, string> = {
  health: "#22c55e",
  mind:   "#818cf8",
  avoid:  "#f87171",
  perform:"#fb923c",
};

export default function HabitsPage() {
  const [localDate,      setLocalDate]      = useState(() => getLocalDate("UTC"));
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  const { data: profile } = api.user.getProfile.useQuery(undefined, { retry: false });

  useEffect(() => {
    if (profile?.timezone) setLocalDate(getLocalDate(profile.timezone));
  }, [profile?.timezone]);

  const { data: habits, isLoading, isError, refetch } = api.habits.list.useQuery(
    { localDate },
    { retry: false }
  );

  const isFree  = !profile || profile.tier === "free";
  const atLimit = isFree && (habits?.length ?? 0) >= 3;

  /* ── Derived stats ── */
  const stats = useMemo(() => {
    if (!habits) return { total: 0, completed: 0, missed: 0, pending: 0, streakTotal: 0 };
    return {
      total:       habits.length,
      completed:   habits.filter((h) => h.today_status === "completed").length,
      missed:      habits.filter((h) => h.today_status === "missed").length,
      pending:     habits.filter((h) => h.today_status === "pending").length,
      streakTotal: habits.reduce((sum, h) => sum + (h.current_streak ?? 0), 0),
    };
  }, [habits]);

  /* ── Category counts ── */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: habits?.length ?? 0 };
    habits?.forEach((h) => {
      counts[h.category] = (counts[h.category] ?? 0) + 1;
    });
    return counts;
  }, [habits]);

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    if (!habits) return [];
    if (activeCategory === "all") return habits;
    return habits.filter((h) => h.category === activeCategory);
  }, [habits, activeCategory]);

  const progressPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const formattedDate = localDate
    ? new Date(localDate + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric",
      })
    : "";

  return (
    <div className="mx-auto max-w-5xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 2xl:py-12">

      {/* ══════════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════════ */}
      <div className="mb-6 sm:mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl 2xl:text-5xl font-bold text-text-primary">
            Habits
          </h1>
          <p className="mt-1 text-sm text-text-muted">{formattedDate}</p>
        </div>

        <Link
          href="/habits/new"
          className={`flex items-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-bold text-forge-base transition-all ${
            atLimit
              ? "pointer-events-none bg-forge-orange opacity-40 cursor-not-allowed"
              : "bg-forge-orange hover:bg-forge-orange-hover"
          }`}
        >
          <Plus size={16} />
          New Habit
        </Link>
      </div>

      {/* ══════════════════════════════════════════
          TODAY'S SUMMARY CARD (shown once loaded)
      ══════════════════════════════════════════ */}
      {!isLoading && habits && habits.length > 0 && (
        <div className="mb-6 border border-forge-border bg-forge-elevated">
          {/* Top row: 4 stat tiles */}
          <div className="grid grid-cols-2 divide-x divide-y divide-forge-border sm:grid-cols-4 sm:divide-y-0">
            {[
              {
                icon: <LayoutGrid size={14} />,
                label: "Total",
                value: stats.total,
                color: "text-text-primary",
              },
              {
                icon: <CheckCircle2 size={14} />,
                label: "Done",
                value: stats.completed,
                color: "text-[#22c55e]",
              },
              {
                icon: <XCircle size={14} />,
                label: "Missed",
                value: stats.missed,
                color: "text-[#f87171]",
              },
              {
                icon: <Flame size={14} />,
                label: "Pending",
                value: stats.pending,
                color: "text-forge-orange",
              },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center gap-1 px-4 py-4">
                <span className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-text-muted`}>
                  <span className={s.color}>{s.icon}</span>
                  {s.label}
                </span>
                <span className={`font-heading text-2xl 2xl:text-3xl font-bold tabular-nums ${s.color}`}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>

          {/* Progress bar row */}
          <div className="border-t border-forge-border px-5 py-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Today's progress</span>
              <span className="text-xs font-bold text-text-secondary">{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden bg-forge-border">
              <div
                className="h-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                  background:
                    progressPct === 100
                      ? "#22c55e"
                      : progressPct >= 50
                      ? "#fb923c"
                      : "#FF6B2B",
                }}
              />
            </div>
            {progressPct === 100 && (
              <p className="mt-1.5 text-xs font-semibold text-[#22c55e]">
                🏆 All habits completed today!
              </p>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          FREE TIER UPGRADE BANNER
      ══════════════════════════════════════════ */}
      {atLimit && (
        <div className="mb-6 border border-forge-orange/40 bg-[#1A0A04] px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-text-primary">
                Free plan limit reached — 3 habits maximum
              </p>
              <p className="mt-1 text-sm text-text-muted">
                Upgrade to Pro for unlimited habits and the full forge experience.
              </p>
            </div>
            <button className="shrink-0 border border-forge-orange px-4 py-2 text-xs font-bold text-forge-orange hover:bg-forge-orange hover:text-forge-base transition-colors">
              Upgrade to Pro →
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          CATEGORY FILTER TABS
      ══════════════════════════════════════════ */}
      {!isLoading && habits && habits.length > 0 && (
        <div className="mb-4 flex items-center gap-0 overflow-x-auto">
          {CATEGORY_FILTERS.map((f) => {
            const count   = categoryCounts[f.id] ?? 0;
            const isActive = activeCategory === f.id;
            const accent  = f.id !== "all" ? CATEGORY_ACCENT[f.id] : undefined;
            if (f.id !== "all" && count === 0) return null;
            return (
              <button
                key={f.id}
                onClick={() => setActiveCategory(f.id)}
                className={`relative flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors ${
                  isActive
                    ? "text-text-primary"
                    : "border-transparent text-text-muted hover:text-text-secondary"
                }`}
                style={
                  isActive
                    ? { borderBottomColor: accent ?? "#FF6B2B" }
                    : undefined
                }
              >
                {f.id !== "all" && accent && (
                  <span
                    className="inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ background: isActive ? accent : "#4A4845" }}
                  />
                )}
                {f.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                    isActive ? "bg-forge-border text-text-secondary" : "bg-forge-border text-text-disabled"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════
          LOADING SKELETON
      ══════════════════════════════════════════ */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[76px] animate-pulse bg-forge-elevated"
              style={{ borderLeft: "3px solid #2A2927", border: "1px solid #2A2927", borderLeft: "3px solid #2A2927" }}
            />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════
          ERROR STATE
      ══════════════════════════════════════════ */}
      {!isLoading && isError && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center border border-forge-border bg-forge-elevated text-2xl">
            ⚠️
          </div>
          <div>
            <p className="text-base font-semibold text-text-secondary">Failed to load habits</p>
            <p className="mt-1 text-sm text-text-muted">Check your connection and try again.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="bg-forge-orange px-6 py-2.5 text-sm font-bold text-forge-base hover:bg-forge-orange-hover transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════
          EMPTY STATE
      ══════════════════════════════════════════ */}
      {!isLoading && !isError && (!habits || habits.length === 0) && (
        <div className="flex flex-col items-center gap-5 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center border border-forge-border bg-forge-elevated">
            <Flame size={28} className="text-forge-orange" />
          </div>
          <div>
            <p className="text-lg font-bold text-text-primary">No habits yet</p>
            <p className="mt-1.5 text-sm text-text-muted max-w-xs">
              Start building your first habit to track progress, streaks, and growth over time.
            </p>
          </div>
          <Link
            href="/habits/new"
            className="flex items-center gap-2 bg-forge-orange px-6 py-3 text-sm font-bold text-forge-base hover:bg-forge-orange-hover transition-colors"
          >
            <Plus size={15} />
            Create First Habit
          </Link>

          {/* Feature hints */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 max-w-xl">
            {[
              { icon: <Flame size={14} />,  label: "Streak tracking",     desc: "Build consecutive day chains" },
              { icon: <Target size={14} />, label: "Completion history",  desc: "90-day activity heatmap" },
              { icon: <Zap size={14} />,    label: "XP & leveling",        desc: "Earn XP for every completion" },
            ].map((f) => (
              <div
                key={f.label}
                className="border border-forge-border bg-forge-elevated px-4 py-3 text-left"
              >
                <div className="mb-1.5 flex items-center gap-2 text-forge-orange">{f.icon}</div>
                <p className="text-xs font-bold text-text-primary">{f.label}</p>
                <p className="text-xs text-text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          HABITS LIST
      ══════════════════════════════════════════ */}
      {!isLoading && habits && habits.length > 0 && (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm font-medium text-text-muted">
                No habits in this category.
              </p>
              <button
                onClick={() => setActiveCategory("all")}
                className="text-xs text-forge-orange hover:underline"
              >
                View all habits
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((h) => (
                <HabitCard
                  key={h.id}
                  habit={h as typeof h & { today_status: "pending" | "completed" | "missed" }}
                  localDate={localDate}
                  onUpdate={() => refetch()}
                />
              ))}
            </div>
          )}

          {/* Footer: habit count summary */}
          <div className="mt-6 flex items-center justify-between border-t border-forge-border pt-4 text-xs text-text-disabled">
            <span>
              {filtered.length} habit{filtered.length !== 1 ? "s" : ""}
              {activeCategory !== "all" ? ` in ${activeCategory}` : " tracked"}
            </span>
            {stats.streakTotal > 0 && (
              <span className="flex items-center gap-1">
                <Flame size={11} className="text-forge-orange" />
                {stats.streakTotal} combined streak days
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
