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

const CATEGORY_COLORS: Record<string, string> = {
  health: "#22C55E",
  mind: "#818CF8",
  avoid: "#F87171",
  perform: "#FB923C",
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
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <p className="text-text-muted">Habit not found or archived.</p>
        <Link href="/habits" className="mt-4 inline-flex items-center gap-1.5 text-sm text-forge-orange hover:underline">
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

  const categoryColor = habit ? (CATEGORY_COLORS[habit.category] ?? "#FF6B2B") : "#FF6B2B";

  return (
    <>
      <style>{`
        .stat-card {
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .stat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,107,43,0.04) 0%, transparent 60%);
          pointer-events: none;
        }
        .back-link {
          transition: color 0.2s ease, gap 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
        }
        .back-link:hover { color: #EDEDEF; }
        .back-link:hover svg { transform: translateX(-2px); }
        .back-link svg { transition: transform 0.2s ease; }
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          min-width: 44px;
          border: 1px solid #2A2927;
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
        }
        .action-btn:hover { border-color: #3A3937; background: #1A1918; }
        .action-btn.danger:hover { border-color: #7F1D1D; color: #F87171; }
        .edit-input {
          flex: 1;
          border: 1px solid #2A2927;
          background: #111110;
          padding: 0.5rem 0.75rem;
          font-size: 1.25rem;
          font-weight: 700;
          color: #EDEDEF;
          outline: none;
          transition: border-color 0.2s ease;
          width: 100%;
        }
        .edit-input:focus { border-color: #FF6B2B; }
        .save-btn {
          display: flex; align-items: center; gap: 0.375rem;
          background: #FF6B2B; color: #0A0908;
          padding: 0.5rem 1rem; min-height: 44px;
          font-size: 0.875rem; font-weight: 700;
          transition: background 0.2s ease;
          white-space: nowrap;
        }
        .save-btn:hover { background: #E55A1A; }
        .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .cancel-btn {
          display: flex; align-items: center; justify-content: center;
          min-height: 44px; min-width: 44px;
          border: 1px solid #2A2927; color: #87857F;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .cancel-btn:hover { border-color: #3A3937; color: #EDEDEF; }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; gap: 0.75rem !important; }
          .stat-value { font-size: 2rem !important; }
        }
        @media (max-width: 640px) {
          .edit-row { flex-direction: column; }
          .edit-actions { flex-direction: row; }
        }
      `}</style>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-10">

        {/* Back link */}
        <Link href="/habits" className="back-link mb-6 sm:mb-8 text-sm text-text-muted">
          <ChevronLeft size={16} />
          All Habits
        </Link>

        {!habit ? (
          /* Loading skeleton */
          <div className="mt-6 space-y-4">
            <div className="h-9 w-3/4 animate-pulse rounded bg-forge-elevated" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-forge-elevated" />
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded bg-forge-elevated" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Title row */}
            <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {editing ? (
                  <div className="edit-row flex gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={60}
                      className="edit-input"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") setEditing(false);
                      }}
                      autoFocus
                    />
                    <div className="edit-actions flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={updateMutation.isPending}
                        className="save-btn"
                      >
                        <Check size={14} />
                        Save
                      </button>
                      <button onClick={() => setEditing(false)} className="cancel-btn">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="font-heading text-2xl sm:text-3xl font-bold text-text-primary leading-tight break-words">
                      {habit.name}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wider"
                        style={{
                          background: `${categoryColor}18`,
                          color: categoryColor,
                          border: `1px solid ${categoryColor}30`,
                        }}
                      >
                        {CATEGORY_LABELS[habit.category] ?? habit.category}
                      </span>
                      <span className="text-sm text-text-muted">
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
                    className="action-btn text-text-muted"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={handleArchive}
                    disabled={archiving}
                    title="Archive habit"
                    className="action-btn danger text-text-muted disabled:opacity-40"
                  >
                    <Archive size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Stat cards */}
            <div
              className="stats-grid mb-8 sm:mb-10"
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}
            >
              {[
                {
                  label: "Current Streak",
                  value: `${habit.current_streak}d`,
                  sublabel: habit.current_streak === 0 ? "Start today" : habit.current_streak === 1 ? "Day 1 🔥" : "Keep going",
                },
                {
                  label: "Longest Streak",
                  value: `${habit.longest_streak}d`,
                  sublabel: "Personal best",
                },
                {
                  label: "Completion",
                  value: `${completionRate}%`,
                  sublabel: `${completedCount} of ${totalLogged} days`,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="stat-card border border-forge-border bg-forge-elevated p-4 sm:p-5 text-center"
                >
                  <p
                    className="stat-value font-heading font-bold tabular-nums"
                    style={{ fontSize: "clamp(1.5rem, 4vw, 2.25rem)", color: "#FF6B2B" }}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-text-muted">{stat.label}</p>
                  <p className="mt-0.5 text-[10px] text-text-disabled">{stat.sublabel}</p>
                </div>
              ))}
            </div>

            {/* 90-day heatmap */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                  Last 90 Days
                </h2>
                <span className="text-xs text-text-disabled">
                  {completedCount} completed
                </span>
              </div>

              <div className="border border-forge-border bg-forge-elevated p-4 sm:p-5">
                <HabitGrid history={historyArr} />
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-text-muted">
                {[
                  { color: "#22C55E", label: "Completed" },
                  { color: "#EF4444", label: "Missed" },
                  { color: "#2A2927", label: "No data" },
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 flex-shrink-0"
                      style={{ background: color, borderRadius: "3px" }}
                    />
                    {label}
                  </span>
                ))}
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 flex-shrink-0"
                    style={{ background: "#2A2927", borderRadius: "3px", outline: "1px solid #FF6B2B", outlineOffset: "1px" }}
                  />
                  Today
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
