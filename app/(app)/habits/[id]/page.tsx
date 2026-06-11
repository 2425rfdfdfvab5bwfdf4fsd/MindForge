"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Archive, Pencil, Check, X } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { HabitGrid } from "@/components/forge/HabitGrid";

const CATEGORY_LABELS: Record<string, string> = {
  health: "Health",
  mind: "Mind",
  avoid: "Avoid",
  perform: "Perform",
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  health: { bg: "#052e16", text: "#22c55e", border: "#14532d" },
  mind:   { bg: "#1e1b4b", text: "#818cf8", border: "#312e81" },
  avoid:  { bg: "#450a0a", text: "#f87171", border: "#7f1d1d" },
  perform:{ bg: "#431407", text: "#fb923c", border: "#7c2d12" },
};

export default function HabitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [archiving, setArchiving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");

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
    onSuccess: () => {
      setEditing(false);
      refetch();
    },
  });

  const habit = habits?.find((h) => h.id === id);

  if (habits && !habit) {
    return (
      <div className="mx-auto max-w-6xl 2xl:max-w-9xl px-4 sm:px-6 py-6 sm:py-8 2xl:py-10">
        <p className="text-text-muted">Habit not found or archived.</p>
        <Link
          href="/habits"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-forge-orange hover:underline"
        >
          <ChevronLeft size={14} /> Back to Habits
        </Link>
      </div>
    );
  }

  const historyArr = history ?? [];
  const completedCount = historyArr.filter((h) => h.completed).length;
  const totalLogged = historyArr.length;
  const completionRate =
    totalLogged > 0 ? Math.round((completedCount / totalLogged) * 100) : 0;

  async function handleArchive() {
    if (!window.confirm("Archive this habit? It won't appear in your daily list anymore.")) return;
    setArchiving(true);
    try {
      await archiveMutation.mutateAsync({ id });
    } finally {
      setArchiving(false);
    }
  }

  function startEdit() {
    setEditName(habit?.name ?? "");
    setEditing(true);
  }

  async function handleSaveEdit() {
    if (!editName.trim()) return;
    await updateMutation.mutateAsync({ id, name: editName.trim() });
  }

  const cat = habit ? (CATEGORY_COLORS[habit.category] ?? CATEGORY_COLORS.perform) : null;

  /* ── Heatmap card — reused in both mobile and desktop columns ── */
  const HeatmapCard = (
    <div className="border border-forge-border bg-forge-elevated p-4 2xl:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-text-muted">Last 90 Days</p>
        <span className="text-xs text-text-disabled">{completedCount} done</span>
      </div>
      <HabitGrid history={historyArr} />
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-text-muted">
        {[
          { color: "#22C55E", label: "Done" },
          { color: "#EF4444", label: "Missed" },
          { color: "#2A2927", label: "No data" },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 flex-shrink-0 rounded-[2px]" style={{ background: color }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 flex-shrink-0 rounded-[2px]"
            style={{ background: "#2A2927", outline: "1px solid #FF6B2B", outlineOffset: "1px" }}
          />
          Today
        </span>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl 2xl:max-w-9xl px-4 sm:px-6 py-6 sm:py-8 2xl:py-10">

      {/* Back link */}
      <Link
        href="/habits"
        className="mb-6 sm:mb-8 inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-text-secondary"
      >
        <ChevronLeft size={16} />
        All Habits
      </Link>

      {!habit ? (
        /* Loading skeleton */
        <div className="animate-pulse space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-2/3 rounded bg-forge-border" />
            <div className="h-4 w-1/4 rounded bg-forge-border" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 border border-forge-border bg-forge-elevated" />
                ))}
              </div>
            </div>
            <div className="h-48 border border-forge-border bg-forge-elevated" />
          </div>
        </div>
      ) : (
        <>
          {/* Page header — full width on all screens */}
          <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={60}
                    className="flex-1 border border-forge-border bg-[#111110] px-3 py-2 font-heading text-2xl font-bold text-text-primary outline-none transition-colors focus:border-forge-orange"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit();
                      if (e.key === "Escape") setEditing(false);
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={updateMutation.isPending}
                      className="flex min-h-[44px] items-center gap-1.5 bg-forge-orange px-4 text-sm font-bold text-forge-base transition-colors hover:bg-forge-orange-hover disabled:opacity-50"
                    >
                      <Check size={14} /> Save
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-forge-border text-text-muted transition-colors hover:border-forge-border-strong hover:text-text-primary"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="font-heading text-2xl sm:text-3xl 2xl:text-4xl font-bold leading-tight break-words text-text-primary">
                    {habit.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {cat && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wider"
                        style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}
                      >
                        {CATEGORY_LABELS[habit.category] ?? habit.category}
                      </span>
                    )}
                    <span className="text-sm 2xl:text-base text-text-muted">
                      {habit.habit_type === "build" ? "Build habit" : "Avoid habit"}
                    </span>
                  </div>
                </>
              )}
            </div>

            {!editing && (
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={startEdit}
                  title="Edit name"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-forge-border text-text-muted transition-colors hover:border-forge-border-strong hover:text-text-primary"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  title="Archive habit"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-forge-border text-text-muted transition-colors hover:border-red-800 hover:text-red-400 disabled:opacity-40"
                >
                  <Archive size={15} />
                </button>
              </div>
            )}
          </div>

          {/* ── Mobile: heatmap above stats ── */}
          <div className="mb-4 lg:hidden">{HeatmapCard}</div>

          {/* ── Two-column grid (desktop) / single column (mobile) ── */}
          <div className="grid grid-cols-1 gap-6 2xl:gap-8 lg:grid-cols-3">

            {/* Left — stat cards (2/3 width on desktop) */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-3 gap-4 2xl:gap-6">
                {[
                  {
                    label: "Current Streak",
                    value: `${habit.current_streak}d`,
                    sub: habit.current_streak === 0
                      ? "Start today"
                      : habit.current_streak === 1
                      ? "Day 1 🔥"
                      : "Keep going",
                  },
                  {
                    label: "Longest Streak",
                    value: `${habit.longest_streak}d`,
                    sub: "Personal best",
                  },
                  {
                    label: "Completion",
                    value: `${completionRate}%`,
                    sub: `${completedCount} / ${totalLogged} days`,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="border border-forge-border bg-forge-elevated p-4 2xl:p-5 text-center"
                  >
                    <p className="font-heading text-2xl sm:text-3xl 2xl:text-4xl font-bold tabular-nums text-forge-orange">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[10px] sm:text-xs 2xl:text-sm font-medium uppercase tracking-wider text-text-muted">
                      {stat.label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-text-disabled">{stat.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — heatmap (1/3 width on desktop, hidden on mobile — shown above instead) */}
            <div className="hidden lg:block">{HeatmapCard}</div>
          </div>
        </>
      )}
    </div>
  );
}
