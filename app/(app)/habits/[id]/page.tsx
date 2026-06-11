"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ChevronLeft,
  Archive,
  Pencil,
  Check,
  X,
  Flame,
  Trophy,
  Target,
  Calendar,
  TrendingUp,
  Zap,
} from "lucide-react";
import { api } from "@/lib/trpc/client";
import { HabitGrid } from "@/components/forge/HabitGrid";

const CATEGORY_LABELS: Record<string, string> = {
  health: "Health",
  mind: "Mind",
  avoid: "Avoid",
  perform: "Perform",
};

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string; glow: string; accent: string }
> = {
  health:  { bg: "#052e16",  text: "#22c55e",  border: "#14532d", glow: "rgba(34,197,94,0.12)",   accent: "#22c55e" },
  mind:    { bg: "#1e1b4b",  text: "#818cf8",  border: "#312e81", glow: "rgba(129,140,248,0.12)", accent: "#818cf8" },
  avoid:   { bg: "#450a0a",  text: "#f87171",  border: "#7f1d1d", glow: "rgba(248,113,113,0.12)", accent: "#f87171" },
  perform: { bg: "#431407",  text: "#fb923c",  border: "#7c2d12", glow: "rgba(251,146,60,0.12)",  accent: "#fb923c" },
};

/* ─── Circular progress ring ─────────────────────────────── */
function RingProgress({ value, color }: { value: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width="72" height="72" className="rotate-[-90deg]">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#2A2927" strokeWidth="5" />
      <circle
        cx="36" cy="36" r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="butt"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

export default function HabitDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const id       = params.id as string;

  const [archiving, setArchiving] = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [editName,  setEditName]  = useState("");

  const { data: habits, refetch } = api.habits.list.useQuery(
    { localDate: new Date().toISOString().slice(0, 10) },
    { retry: false }
  );

  const { data: history } = api.habits.getCompletionHistory.useQuery(
    { habitId: id, days: 90 },
    { retry: false }
  );

  const archiveMutation = api.habits.archive.useMutation({
    onSuccess: () => router.push("/habits"),
  });

  const updateMutation = api.habits.update.useMutation({
    onSuccess: () => { setEditing(false); refetch(); },
  });

  const habit      = habits?.find((h) => h.id === id);
  const historyArr = history ?? [];
  const completedCount = historyArr.filter((h) => h.completed).length;
  const totalLogged    = historyArr.length;
  const completionRate = totalLogged > 0 ? Math.round((completedCount / totalLogged) * 100) : 0;

  const cat = habit ? (CATEGORY_COLORS[habit.category] ?? CATEGORY_COLORS.perform) : null;

  async function handleArchive() {
    if (!window.confirm("Archive this habit? It won't appear in your daily list anymore.")) return;
    setArchiving(true);
    try { await archiveMutation.mutateAsync({ id }); }
    finally { setArchiving(false); }
  }

  function startEdit() {
    setEditName(habit?.name ?? "");
    setEditing(true);
  }

  async function handleSaveEdit() {
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error("Habit name cannot be empty.");
      return;
    }
    try {
      await updateMutation.mutateAsync({ id, name: trimmed });
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  }

  /* ── Not found ── */
  if (habits && !habit) {
    return (
      <div className="mx-auto max-w-6xl 2xl:max-w-8xl px-4 sm:px-6 py-10">
        <p className="text-text-muted">Habit not found or archived.</p>
        <Link href="/habits" className="mt-4 inline-flex items-center gap-1.5 text-sm text-forge-orange hover:underline">
          <ChevronLeft size={14} /> Back to Habits
        </Link>
      </div>
    );
  }

  /* ── Loading skeleton ── */
  if (!habit) {
    return (
      <div className="mx-auto max-w-6xl 2xl:max-w-8xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6 h-5 w-24 animate-pulse rounded-sm bg-forge-border" />
        <div className="animate-pulse space-y-6">
          <div className="h-40 w-full rounded-sm bg-forge-elevated" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-sm bg-forge-elevated" />)}
          </div>
          <div className="h-52 rounded-sm bg-forge-elevated" />
        </div>
      </div>
    );
  }

  const isAvoid   = habit.habit_type === "avoid";
  const streakEmoji = habit.current_streak >= 30 ? "🏆" : habit.current_streak >= 7 ? "🔥" : habit.current_streak >= 1 ? "⚡" : "";
  const streakSub   = habit.current_streak === 0 ? "Start today" : habit.current_streak === 1 ? "Day 1 — keep going" : `${habit.current_streak} days straight`;

  return (
    <div className="mx-auto max-w-6xl 2xl:max-w-8xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 2xl:py-12">

      {/* ── Back link ── */}
      <Link
        href="/habits"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-secondary"
      >
        <ChevronLeft size={15} />
        All Habits
      </Link>

      {/* ══════════════════════════════════════════════
          HERO HEADER CARD
      ══════════════════════════════════════════════ */}
      <div
        className="relative mb-6 overflow-hidden border border-forge-border bg-forge-elevated"
        style={{ boxShadow: cat ? `0 0 40px 0 ${cat.glow}` : undefined }}
      >
        {/* Category accent bar */}
        {cat && (
          <div className="absolute inset-y-0 left-0 w-1" style={{ background: cat.accent }} />
        )}

        {/* Subtle background gradient behind accent */}
        {cat && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(105deg, ${cat.glow} 0%, transparent 55%)`,
            }}
          />
        )}

        <div className="relative px-6 py-6 sm:px-8 sm:py-7 2xl:px-10 2xl:py-8">
          {/* Top row: name + actions */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={60}
                    className="flex-1 border border-forge-border bg-forge-base px-3 py-2 font-heading text-2xl sm:text-3xl font-bold text-text-primary outline-none transition-colors focus:border-forge-orange"
                    onKeyDown={(e) => {
                      if (e.key === "Enter")  handleSaveEdit();
                      if (e.key === "Escape") setEditing(false);
                    }}
                    autoFocus
                  />
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={updateMutation.isPending}
                      className="flex min-h-[42px] items-center gap-1.5 bg-forge-orange px-5 text-sm font-bold text-forge-base transition-colors hover:bg-forge-orange-hover disabled:opacity-50"
                    >
                      <Check size={14} /> Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex min-h-[42px] min-w-[42px] items-center justify-center border border-forge-border text-text-muted transition-colors hover:border-forge-border-strong hover:text-text-primary"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <h1 className="font-heading text-2xl sm:text-3xl 2xl:text-4xl font-bold leading-tight break-words text-text-primary">
                  {habit.name}
                </h1>
              )}

              {/* Badges row */}
              {!editing && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {cat && (
                    <span
                      className="inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase tracking-widest"
                      style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}
                    >
                      {CATEGORY_LABELS[habit.category] ?? habit.category}
                    </span>
                  )}
                  <span
                    className="inline-flex items-center gap-1.5 border border-forge-border px-2.5 py-1 text-xs font-medium uppercase tracking-widest text-text-muted"
                  >
                    {isAvoid ? <X size={10} /> : <Zap size={10} />}
                    {isAvoid ? "Avoid habit" : "Build habit"}
                  </span>
                  {habit.current_streak > 0 && (
                    <span className="inline-flex items-center gap-1 border border-forge-border px-2.5 py-1 text-xs font-medium text-text-muted">
                      <Flame size={10} className="text-forge-orange" />
                      {habit.current_streak}d streak
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            {!editing && (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={startEdit}
                  title="Edit name"
                  className="group flex min-h-[40px] min-w-[40px] items-center justify-center border border-forge-border bg-forge-base text-text-muted transition-all hover:border-forge-border-strong hover:text-text-primary"
                >
                  <Pencil size={14} className="transition-transform group-hover:scale-110" />
                </button>
                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  title="Archive habit"
                  className="group flex min-h-[40px] min-w-[40px] items-center justify-center border border-forge-border bg-forge-base text-text-muted transition-all hover:border-red-800 hover:bg-[#2a0a0a] hover:text-red-400 disabled:opacity-40"
                >
                  <Archive size={14} className="transition-transform group-hover:scale-110" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          STAT CARDS  ×3
      ══════════════════════════════════════════════ */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 2xl:gap-6">

        {/* Current Streak */}
        <div className="group relative overflow-hidden border border-forge-border bg-forge-elevated p-5 2xl:p-6 transition-colors hover:border-forge-border-strong">
          <div className="pointer-events-none absolute right-4 top-4 text-forge-orange opacity-10 transition-opacity group-hover:opacity-20">
            <Flame size={48} />
          </div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Current Streak</p>
              <p className="mt-2 font-heading text-4xl 2xl:text-5xl font-bold tabular-nums text-forge-orange leading-none">
                {habit.current_streak}
                <span className="ml-1 text-xl font-semibold text-forge-orange-text">d</span>
              </p>
              <p className="mt-2 text-xs text-text-muted">
                {streakEmoji && <span className="mr-1">{streakEmoji}</span>}
                {streakSub}
              </p>
            </div>
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-forge-border bg-forge-base text-forge-orange">
              <Flame size={16} />
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-0.5 w-full bg-forge-border">
            <div
              className="h-full bg-forge-orange transition-all duration-700"
              style={{ width: `${Math.min(100, (habit.current_streak / Math.max(habit.longest_streak, 1)) * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-text-disabled">
            {habit.longest_streak > 0
              ? `${Math.round((habit.current_streak / habit.longest_streak) * 100)}% of personal best`
              : "No streak data yet"}
          </p>
        </div>

        {/* Longest Streak */}
        <div className="group relative overflow-hidden border border-forge-border bg-forge-elevated p-5 2xl:p-6 transition-colors hover:border-forge-border-strong">
          <div className="pointer-events-none absolute right-4 top-4 text-yellow-500 opacity-10 transition-opacity group-hover:opacity-20">
            <Trophy size={48} />
          </div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Longest Streak</p>
              <p className="mt-2 font-heading text-4xl 2xl:text-5xl font-bold tabular-nums text-text-primary leading-none">
                {habit.longest_streak}
                <span className="ml-1 text-xl font-semibold text-text-muted">d</span>
              </p>
              <p className="mt-2 text-xs text-text-muted">Personal best</p>
            </div>
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-forge-border bg-forge-base text-yellow-500">
              <Trophy size={16} />
            </div>
          </div>
          <div className="mt-4 h-0.5 w-full bg-forge-border">
            <div className="h-full bg-yellow-600" style={{ width: "100%" }} />
          </div>
          <p className="mt-1.5 text-[10px] text-text-disabled">All-time record</p>
        </div>

        {/* Completion Rate */}
        <div className="group relative overflow-hidden border border-forge-border bg-forge-elevated p-5 2xl:p-6 transition-colors hover:border-forge-border-strong">
          <div className="pointer-events-none absolute right-4 top-4 text-sky-500 opacity-10 transition-opacity group-hover:opacity-20">
            <Target size={48} />
          </div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Completion Rate</p>
              <p className="mt-2 font-heading text-4xl 2xl:text-5xl font-bold tabular-nums text-text-primary leading-none">
                {completionRate}
                <span className="ml-0.5 text-xl font-semibold text-text-muted">%</span>
              </p>
              <p className="mt-2 text-xs text-text-muted">
                {completedCount} of {totalLogged} logged days
              </p>
            </div>
            <div className="relative mt-0.5 shrink-0">
              <RingProgress
                value={completionRate}
                color={completionRate >= 80 ? "#22c55e" : completionRate >= 50 ? "#fb923c" : "#ef4444"}
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-text-primary">
                {completionRate}%
              </span>
            </div>
          </div>
          <div className="mt-4 h-0.5 w-full bg-forge-border">
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${completionRate}%`,
                background: completionRate >= 80 ? "#22c55e" : completionRate >= 50 ? "#fb923c" : "#ef4444",
              }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-text-disabled">Last 90 days</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          ACTIVITY HEATMAP — full width
      ══════════════════════════════════════════════ */}
      <div className="border border-forge-border bg-forge-elevated">
        {/* Card header */}
        <div className="flex items-center justify-between border-b border-forge-border px-6 py-4 2xl:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center border border-forge-border bg-forge-base text-text-muted">
              <Calendar size={13} />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Activity Heatmap</p>
              <p className="text-xs text-text-muted">Last 90 days</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              {[
                { color: "#22C55E", label: "Done" },
                { color: "#EF4444", label: "Missed" },
                { color: "#2A2927", label: "No data" },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-xs text-text-muted">
                  <span className="inline-block h-2.5 w-2.5 flex-shrink-0" style={{ background: color }} />
                  {label}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                <span
                  className="inline-block h-2.5 w-2.5 flex-shrink-0"
                  style={{ background: "#2A2927", outline: "1px solid #FF6B2B", outlineOffset: "1px" }}
                />
                Today
              </span>
            </div>
            <span className="border border-forge-border bg-forge-base px-2.5 py-1 text-xs font-semibold text-forge-orange">
              {completedCount} done
            </span>
          </div>
        </div>

        {/* Grid body */}
        <div className="px-6 py-5 2xl:px-8 2xl:py-6">
          <HabitGrid history={historyArr} fullWidth />
        </div>

        {/* Mobile legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-forge-border px-6 py-3 sm:hidden">
          {[
            { color: "#22C55E", label: "Done" },
            { color: "#EF4444", label: "Missed" },
            { color: "#2A2927", label: "No data" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="inline-block h-2 w-2 flex-shrink-0" style={{ background: color }} />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            <span
              className="inline-block h-2 w-2 flex-shrink-0"
              style={{ background: "#2A2927", outline: "1px solid #FF6B2B", outlineOffset: "1px" }}
            />
            Today
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          INSIGHTS ROW  (bottom)
      ══════════════════════════════════════════════ */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:gap-6">
        {/* Trend insight */}
        <div className="border border-forge-border bg-forge-elevated px-5 py-4 2xl:px-6">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
            <TrendingUp size={12} />
            Trend
          </div>
          <p className="text-sm text-text-secondary">
            {completionRate >= 80
              ? "Excellent consistency. You're crushing this habit."
              : completionRate >= 60
              ? "Good progress. Keep building the momentum."
              : completionRate >= 40
              ? "Room to improve. Try stacking this with an existing habit."
              : totalLogged === 0
              ? "No data yet. Start tracking today."
              : "Needs attention. Small steps build big streaks."}
          </p>
        </div>

        {/* Habit type insight */}
        <div className="border border-forge-border bg-forge-elevated px-5 py-4 2xl:px-6">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-text-muted">
            {isAvoid ? <X size={12} /> : <Zap size={12} />}
            {isAvoid ? "Avoid habit" : "Build habit"}
          </div>
          <p className="text-sm text-text-secondary">
            {isAvoid
              ? "Track days you successfully avoided this behavior."
              : "Track days you successfully performed this action."}
          </p>
        </div>

        {/* Category insight */}
        <div className="border border-forge-border bg-forge-elevated px-5 py-4 2xl:px-6 sm:col-span-2 lg:col-span-1">
          <div
            className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: cat?.text ?? "#87857F" }}
          >
            <span
              className="inline-block h-2 w-2 flex-shrink-0"
              style={{ background: cat?.accent ?? "#87857F" }}
            />
            {CATEGORY_LABELS[habit.category] ?? habit.category}
          </div>
          <p className="text-sm text-text-secondary">
            {habit.category === "health"  && "Physical wellbeing and body-positive routines."}
            {habit.category === "mind"    && "Mental clarity, focus, and cognitive habits."}
            {habit.category === "avoid"   && "Reducing harmful patterns and triggers."}
            {habit.category === "perform" && "Skills, output, and high-performance behaviors."}
          </p>
        </div>
      </div>

    </div>
  );
}
