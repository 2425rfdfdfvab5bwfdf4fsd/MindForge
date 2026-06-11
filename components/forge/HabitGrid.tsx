"use client";

import * as Tooltip from "@radix-ui/react-tooltip";

interface DayCell {
  date: string;
  completed: boolean | null;
}

interface HabitGridProps {
  history: { localDate: string; completed: boolean }[];
}

const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

function buildGrid(history: HabitGridProps["history"]): DayCell[] {
  const completionMap = new Map(
    history.map((h) => [h.localDate, h.completed])
  );
  const cells: DayCell[] = [];
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    cells.push({
      date: dateStr,
      completed: completionMap.has(dateStr) ? completionMap.get(dateStr)! : null,
    });
  }
  return cells;
}

function cellColor(completed: boolean | null, isFuture: boolean): string {
  if (isFuture) return "var(--cell-empty)";
  if (completed === null) return "var(--cell-empty)";
  if (completed) return "#22C55E";
  return "#EF4444";
}

function formatDateLabel(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function completionLabel(completed: boolean | null): string {
  if (completed === null) return "No data";
  return completed ? "Completed" : "Missed";
}

export function HabitGrid({ history }: HabitGridProps) {
  const cells = buildGrid(history);
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstDay = new Date(cells[0].date + "T12:00:00").getDay();
  const paddingCells = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <Tooltip.Provider delayDuration={120}>
      <style>{`
        :root { --cell-empty: #2A2927; }
        .habit-grid-cell {
          aspect-ratio: 1;
          border-radius: 3px;
          cursor: default;
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .habit-grid-cell:hover { opacity: 0.75; transform: scale(1.2); }
      `}</style>

      <div className="w-full">
        {/* Day-of-week header */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {DAYS_OF_WEEK.map((d, i) => (
            <span
              key={i}
              className="text-center text-[10px] font-medium uppercase tracking-wider text-text-muted"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {paddingCells.map((i) => (
            <div key={`pad-${i}`} className="habit-grid-cell" style={{ background: "transparent" }} />
          ))}

          {cells.map((cell) => {
            const isFuture = cell.date > todayStr;
            const color = cellColor(cell.completed, isFuture);
            const isToday = cell.date === todayStr;

            return (
              <Tooltip.Root key={cell.date}>
                <Tooltip.Trigger asChild>
                  <div
                    className="habit-grid-cell"
                    style={{
                      background: color,
                      outline: isToday ? "1px solid #FF6B2B" : "none",
                      outlineOffset: "1px",
                    }}
                  />
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="top"
                    sideOffset={6}
                    className="z-50 border border-forge-border bg-forge-elevated px-2.5 py-1.5 text-xs text-text-secondary shadow-xl"
                  >
                    <span className="font-medium text-text-primary">
                      {formatDateLabel(cell.date)}
                    </span>
                    {" — "}
                    <span
                      style={{
                        color:
                          cell.completed === null
                            ? "#87857F"
                            : cell.completed
                            ? "#22C55E"
                            : "#EF4444",
                      }}
                    >
                      {completionLabel(cell.completed)}
                    </span>
                    <Tooltip.Arrow className="fill-forge-border" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          })}
        </div>
      </div>
    </Tooltip.Provider>
  );
}
