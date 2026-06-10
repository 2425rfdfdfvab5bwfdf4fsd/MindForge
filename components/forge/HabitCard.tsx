"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/client";

interface HabitCardProps {
  habit: {
    id: string;
    name: string;
    category: string;
    habit_type: string;
    today_status: "pending" | "completed" | "missed";
    current_streak: number;
  };
  localDate: string;
  onUpdate?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  health: "Health",
  mind: "Mind",
  avoid: "Avoid",
  perform: "Perform",
};

const BORDER_COLORS: Record<string, string> = {
  completed: "#22C55E",
  missed: "#EF4444",
  pending: "#FF6B2B",
};

// Random between min and max inclusive
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate N spark particle configs
function makeParticles(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    x: rand(-30, 30),
    y: rand(-60, -20),
    delay: i * 30,
    rotate: rand(-180, 180),
  }));
}

export function HabitCard({ habit, localDate, onUpdate }: HabitCardProps) {
  const [status, setStatus] = useState(habit.today_status);
  const [sparks, setSparks] = useState<ReturnType<typeof makeParticles>>([]);

  const logCompletion = api.habits.logCompletion.useMutation({
    onSuccess: () => {
      onUpdate?.();
    },
  });

  const isLocked = status === "completed" || status === "missed";

  const handleLog = useCallback(
    async (completed: boolean) => {
      if (isLocked) return;

      // Optimistic update
      setStatus(completed ? "completed" : "missed");

      if (completed) {
        // Fire sparks: 6–8 random count for variable reward
        setSparks(makeParticles(rand(6, 8)));
        setTimeout(() => setSparks([]), 500);
      }

      try {
        await logCompletion.mutateAsync({
          habitId: habit.id,
          localDate,
          completed,
        });
      } catch {
        // Roll back on error
        setStatus(habit.today_status);
      }
    },
    [isLocked, habit.id, habit.today_status, localDate, logCompletion]
  );

  const borderColor = BORDER_COLORS[status];

  return (
    <>
      <style>{`
        @keyframes forge-spark {
          0%   { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--sx), var(--sy)) scale(0) rotate(var(--sr)); opacity: 0; }
        }
      `}</style>

      <div
        className="relative overflow-visible bg-[#111110] p-5 transition-colors"
        style={{ borderLeft: `3px solid ${borderColor}`, borderTop: "1px solid #1A1918", borderRight: "1px solid #1A1918", borderBottom: "1px solid #1A1918" }}
      >
        {/* Forge spark particles */}
        {sparks.map((p, i) => (
          <span
            key={i}
            className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-forge-orange"
            style={{
              "--sx": `${p.x}px`,
              "--sy": `${p.y}px`,
              "--sr": `${p.rotate}deg`,
              animation: `forge-spark 400ms ease-out ${p.delay}ms forwards`,
              zIndex: 50,
            } as React.CSSProperties}
          />
        ))}

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Link href={`/habits/${habit.id}`}>
              <h3 className="truncate font-heading text-xl font-bold text-text-primary hover:text-forge-orange transition-colors">
                {habit.name}
              </h3>
            </Link>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="text-xs uppercase tracking-wider text-text-muted">
                {CATEGORY_LABELS[habit.category] ?? habit.category}
              </span>
              {habit.current_streak > 0 && (
                <span className="text-sm text-text-muted">
                  {habit.current_streak} day streak
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => handleLog(true)}
              disabled={isLocked || logCompletion.isPending}
              className="min-h-[44px] px-4 py-2 text-xs font-bold text-white transition-opacity disabled:opacity-40"
              style={{ background: "#22C55E" }}
            >
              {status === "completed" ? "✓ Done" : "Completed"}
            </button>
            <button
              onClick={() => handleLog(false)}
              disabled={isLocked || logCompletion.isPending}
              className="min-h-[44px] px-4 py-2 text-xs font-bold text-white transition-opacity disabled:opacity-40"
              style={{ background: "#EF4444" }}
            >
              {status === "missed" ? "✗ Missed" : "Missed"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
