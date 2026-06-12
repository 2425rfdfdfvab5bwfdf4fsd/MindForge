"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Flame, ChevronRight, Check, X, Zap } from "lucide-react";
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

const CATEGORY_STYLES: Record<string, { accent: string; text: string; bg: string; border: string }> = {
  health:  { accent: "#22c55e", text: "#22c55e",  bg: "#052e16",  border: "#14532d" },
  mind:    { accent: "#818cf8", text: "#818cf8",  bg: "#1e1b4b",  border: "#312e81" },
  avoid:   { accent: "#f87171", text: "#f87171",  bg: "#450a0a",  border: "#7f1d1d" },
  perform: { accent: "#fb923c", text: "#fb923c",  bg: "#431407",  border: "#7c2d12" },
};

const STATUS_LEFT_BORDER: Record<string, string> = {
  completed: "#22C55E",
  missed:    "#EF4444",
  pending:   "#2A2927",
};

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeParticles(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    x: rand(-40, 40),
    y: rand(-70, -20),
    delay: i * 30,
    rotate: rand(-180, 180),
  }));
}

export function HabitCard({ habit, localDate, onUpdate }: HabitCardProps) {
  const [status, setStatus] = useState(habit.today_status);
  const [sparks, setSparks] = useState<ReturnType<typeof makeParticles>>([]);

  /* Keep local status in sync when the parent refetches and passes new data */
  useEffect(() => {
    setStatus(habit.today_status);
  }, [habit.today_status]);

  const logCompletion = api.habits.logCompletion.useMutation({
    onSuccess: () => onUpdate?.(),
  });

  const isLocked  = status === "completed" || status === "missed";
  const cat       = CATEGORY_STYLES[habit.category] ?? CATEGORY_STYLES.perform;
  const isAvoid   = habit.habit_type === "avoid";

  const handleLog = useCallback(
    async (completed: boolean) => {
      if (isLocked) return;
      setStatus(completed ? "completed" : "missed");
      if (completed) {
        setSparks(makeParticles(rand(6, 8)));
        setTimeout(() => setSparks([]), 600);
      }
      try {
        await logCompletion.mutateAsync({ habitId: habit.id, localDate, completed });
      } catch {
        setStatus(habit.today_status);
        toast.error("Failed to log habit. Please try again.");
      }
    },
    [isLocked, habit.id, habit.today_status, localDate, logCompletion]
  );

  return (
    <>
      <style>{`
        @keyframes forge-spark {
          0%   { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--sx), var(--sy)) scale(0) rotate(var(--sr)); opacity: 0; }
        }
      `}</style>

      <div
        className="group relative overflow-visible bg-forge-elevated transition-all hover:border-forge-border-strong"
        style={{
          borderLeft:   `3px solid ${STATUS_LEFT_BORDER[status]}`,
          borderTop:    "1px solid #2A2927",
          borderRight:  "1px solid #2A2927",
          borderBottom: "1px solid #2A2927",
        }}
      >
        {/* Spark particles */}
        {sparks.map((p, i) => (
          <span
            key={i}
            className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-forge-orange"
            style={{
              "--sx": `${p.x}px`,
              "--sy": `${p.y}px`,
              "--sr": `${p.rotate}deg`,
              animation: `forge-spark 450ms ease-out ${p.delay}ms forwards`,
              zIndex: 50,
            } as React.CSSProperties}
          />
        ))}

        <div className="flex items-stretch">
          {/* Main content */}
          <div className="flex flex-1 min-w-0 flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-4">

            {/* Left: name + meta */}
            <div className="min-w-0 flex-1">
              <Link
                href={`/habits/${habit.id}`}
                className="group/link inline-flex items-center gap-1.5"
              >
                <h3 className="font-heading text-base sm:text-lg font-bold text-text-primary transition-colors group-hover/link:text-forge-orange leading-snug">
                  {habit.name}
                </h3>
                <ChevronRight
                  size={13}
                  className="shrink-0 text-text-disabled opacity-0 transition-all group-hover/link:opacity-100 group-hover/link:translate-x-0.5"
                />
              </Link>

              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {/* Category badge */}
                <span
                  className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: cat.bg, color: cat.text, border: `1px solid ${cat.border}` }}
                >
                  {CATEGORY_LABELS[habit.category] ?? habit.category}
                </span>

                {/* Habit type */}
                <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-widest text-text-disabled">
                  {isAvoid ? <X size={8} /> : <Zap size={8} />}
                  {isAvoid ? "Avoid" : "Build"}
                </span>

                {/* Streak */}
                {habit.current_streak > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                    <Flame size={11} className="text-forge-orange" />
                    {habit.current_streak}d
                  </span>
                )}
              </div>
            </div>

            {/* Right: status + action buttons */}
            <div className="flex shrink-0 items-center gap-2">
              {/* Status pill when logged */}
              {status !== "pending" && (
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs font-semibold"
                  style={
                    status === "completed"
                      ? { borderColor: "#14532d", background: "#052e16", color: "#22c55e" }
                      : { borderColor: "#7f1d1d", background: "#450a0a", color: "#f87171" }
                  }
                >
                  {status === "completed" ? <Check size={10} /> : <X size={10} />}
                  {status === "completed" ? "Done" : "Missed"}
                </span>
              )}

              {/* Done button */}
              <button
                onClick={() => handleLog(true)}
                disabled={isLocked || logCompletion.isPending}
                title="Mark as completed"
                className={`flex min-h-[40px] items-center gap-1.5 px-4 text-xs font-bold transition-all disabled:cursor-not-allowed ${
                  status === "completed"
                    ? "bg-[#052e16] text-[#22c55e] border border-[#14532d]"
                    : status === "missed"
                    ? "bg-forge-elevated border border-forge-border text-text-disabled opacity-50"
                    : "bg-[#052e16] border border-[#14532d] text-[#22c55e] hover:bg-[#14532d]"
                }`}
              >
                <Check size={13} />
                <span className="hidden sm:inline">
                  {status === "completed" ? "Done" : "Complete"}
                </span>
              </button>

              {/* Missed button */}
              <button
                onClick={() => handleLog(false)}
                disabled={isLocked || logCompletion.isPending}
                title="Mark as missed"
                className={`flex min-h-[40px] items-center gap-1.5 px-4 text-xs font-bold transition-all disabled:cursor-not-allowed ${
                  status === "missed"
                    ? "bg-[#450a0a] text-[#f87171] border border-[#7f1d1d]"
                    : status === "completed"
                    ? "bg-forge-elevated border border-forge-border text-text-disabled opacity-50"
                    : "bg-[#1a0808] border border-[#7f1d1d] text-[#f87171] hover:bg-[#450a0a]"
                }`}
              >
                <X size={13} />
                <span className="hidden sm:inline">
                  {status === "missed" ? "Missed" : "Miss"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
