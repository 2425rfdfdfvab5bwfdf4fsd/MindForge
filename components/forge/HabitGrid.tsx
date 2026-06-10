"use client";

import * as Tooltip from "@radix-ui/react-tooltip";

interface DayCell {
  date: string; // YYYY-MM-DD
  completed: boolean | null; // null = no data
}

interface HabitGridProps {
  history: { local_date: string; completed: boolean }[];
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildGrid(history: HabitGridProps["history"]): DayCell[] {
  const completionMap = new Map(
    history.map((h) => [h.local_date, h.completed])
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
  if (isFuture) return "#2A2927";
  if (completed === null) return "#2A2927";
  if (completed) return "#22C55E";
  return "#EF4444";
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function completionLabel(completed: boolean | null): string {
  if (completed === null) return "No data";
  return completed ? "Completed" : "Missed";
}

export function HabitGrid({ history }: HabitGridProps) {
  const cells = buildGrid(history);
  const todayStr = new Date().toISOString().slice(0, 10);

  // Pad start so first cell aligns to correct weekday column
  const firstDay = new Date(cells[0].date + "T12:00:00").getDay();
  const paddingCells = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <Tooltip.Provider delayDuration={120}>
      <div className="overflow-x-auto">
        {/* Day-of-week header */}
        <div className="mb-1.5 grid grid-cols-7 gap-1" style={{ width: 7 * 20 + 6 * 4 }}>
          {DAYS_OF_WEEK.map((d) => (
            <span key={d} className="text-center text-[10px] text-text-muted">
              {d[0]}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1" style={{ width: 7 * 20 + 6 * 4 }}>
          {/* Padding cells to align weekday */}
          {paddingCells.map((i) => (
            <div key={`pad-${i}`} className="h-3 w-3" />
          ))}

          {cells.map((cell) => {
            const isFuture = cell.date > todayStr;
            const color = cellColor(cell.completed, isFuture);

            return (
              <Tooltip.Root key={cell.date}>
                <Tooltip.Trigger asChild>
                  <div
                    className="h-3 w-3 cursor-default rounded-[2px] transition-opacity hover:opacity-80"
                    style={{ background: color }}
                  />
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="top"
                    sideOffset={4}
                    className="z-50 rounded border border-forge-border bg-forge-elevated px-2 py-1 text-xs text-text-secondary shadow-lg"
                  >
                    {formatDateLabel(cell.date)} — {completionLabel(cell.completed)}
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
