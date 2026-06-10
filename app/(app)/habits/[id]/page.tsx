"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Archive, Pencil } from "lucide-react";
import { api } from "@/lib/trpc/client";
import { HabitGrid } from "@/components/forge/HabitGrid";

const CATEGORY_LABELS: Record<string, string> = {
  health: "Health",
  mind: "Mind",
  avoid: "Avoid",
  perform: "Perform",
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
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">
        <p className="text-text-muted">Habit not found or archived.</p>
        <Link href="/habits" className="mt-4 inline-block text-sm text-forge-orange">
          ← Back to Habits
        </Link>
      </div>
    );
  }

  // Completion rate over last 90 days
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

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 sm:py-10">
      {/* Back */}
      <Link
        href="/habits"
        className="mb-8 flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary"
      >
        <ChevronLeft size={16} />
        All Habits
      </Link>

      {!habit ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse bg-forge-elevated" />
          ))}
        </div>
      ) : (
        <>
          {/* Title row */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="flex-1">
              {editing ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={60}
                    className="flex-1 border border-forge-border bg-forge-input px-3 py-2 font-heading text-2xl text-text-primary outline-none focus:border-forge-orange"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit();
                      if (e.key === "Escape") setEditing(false);
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEdit}
                    disabled={updateMutation.isPending}
                    className="bg-forge-orange px-4 min-h-[44px] text-sm font-bold text-forge-base disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="border border-forge-border px-4 min-h-[44px] text-sm text-text-muted"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <h1 className="font-heading text-3xl font-bold text-text-primary">
                  {habit.name}
                </h1>
              )}
              <p className="mt-2 text-sm text-text-muted">
                {CATEGORY_LABELS[habit.category] ?? habit.category} ·{" "}
                {habit.habit_type === "build" ? "Build habit" : "Avoid habit"}
              </p>
            </div>

            {!editing && (
              <div className="flex shrink-0 gap-2">
                <button
                  onClick={startEdit}
                  title="Edit"
                  className="border border-forge-border p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:border-forge-border-strong hover:text-text-primary"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={handleArchive}
                  disabled={archiving}
                  title="Archive"
                  className="border border-forge-border p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:border-red-800 hover:text-red-400 disabled:opacity-50"
                >
                  <Archive size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="mb-10 grid grid-cols-3 gap-4">
            {[
              { label: "Current Streak", value: `${habit.current_streak}d` },
              { label: "Longest Streak", value: `${habit.longest_streak}d` },
              { label: "Completion Rate", value: `${completionRate}%` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="border border-forge-border bg-forge-elevated p-4 text-center"
              >
                <p
                  className="font-heading text-3xl font-bold text-forge-orange tabular-nums"
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-text-muted">
              Last 90 Days
            </h2>
            <HabitGrid history={historyArr} />

            <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[#22C55E]" />
                Completed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[#EF4444]" />
                Missed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-[2px] bg-[#2A2927]" />
                No data
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
