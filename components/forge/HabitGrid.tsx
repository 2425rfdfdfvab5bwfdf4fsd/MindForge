"use client";

import * as Tooltip from "@radix-ui/react-tooltip";

interface DayCell {
  date: string;
  completed: boolean | null;
}

interface HabitGridProps {
  history: { localDate: string; completed: boolean }[];
  fullWidth?: boolean;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildGrid(history: HabitGridProps["history"]): DayCell[] {
  const completionMap = new Map(history.map((h) => [h.localDate, h.completed]));
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

export function HabitGrid({ history, fullWidth = false }: HabitGridProps) {
  const cells     = buildGrid(history);
  const todayStr  = new Date().toISOString().slice(0, 10);
  const firstDay  = new Date(cells[0].date + "T12:00:00").getDay();
  const paddingCells = Array.from({ length: firstDay }, (_, i) => i);

  /* Build month label positions for full-width mode */
  const monthLabels: { label: string; colIndex: number }[] = [];
  if (fullWidth) {
    let currentMonth = -1;
    cells.forEach((cell, i) => {
      const col = Math.floor((firstDay + i) / 7);
      const m   = new Date(cell.date + "T12:00:00").getMonth();
      if (m !== currentMonth) {
        currentMonth = m;
        monthLabels.push({ label: MONTHS[m], colIndex: col });
      }
    });
  }

  const totalCols = Math.ceil((firstDay + cells.length) / 7);

  return (
    <Tooltip.Provider delayDuration={120}>
      <style>{`
        :root { --cell-empty: #2A2927; }
        .habit-grid-cell {
          aspect-ratio: 1;
          cursor: default;
          transition: opacity 0.12s ease, transform 0.12s ease;
        }
        .habit-grid-cell:hover { opacity: 0.75; transform: scale(1.25); }
      `}</style>

      <div className={fullWidth ? "w-full" : "w-full max-w-[300px]"}>

        {/* Month labels — full-width mode only */}
        {fullWidth && (
          <div
            className="mb-1 grid"
            style={{ gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: totalCols }, (_, colIdx) => {
              const ml = monthLabels.find((m) => m.colIndex === colIdx);
              return (
                <span
                  key={colIdx}
                  className="truncate text-[10px] font-medium tracking-wider text-text-disabled"
                >
                  {ml ? ml.label : ""}
                </span>
              );
            })}
          </div>
        )}

        {/* Day-of-week column labels — full-width shows shortened */}
        <div
          className={fullWidth ? "mb-1.5 grid gap-1" : "mb-1.5 grid grid-cols-7 gap-1"}
          style={fullWidth ? { gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` } : undefined}
        >
          {fullWidth
            ? Array.from({ length: totalCols }, (_, colIdx) => {
                const dayOfWeek = colIdx % 7 === 0 ? 0 : colIdx % 7;
                const showLabel = colIdx < 7;
                return (
                  <span
                    key={colIdx}
                    className="text-center text-[9px] font-medium uppercase tracking-wider text-text-muted"
                  >
                    {showLabel ? DAYS_OF_WEEK[dayOfWeek].slice(0, 1) : ""}
                  </span>
                );
              })
            : DAYS_OF_WEEK.map((d, i) => (
                <span
                  key={i}
                  className="text-center text-[10px] font-medium uppercase tracking-wider text-text-muted"
                >
                  {d.slice(0, 1)}
                </span>
              ))}
        </div>

        {/* Grid cells */}
        <div
          className={fullWidth ? "grid gap-1" : "grid grid-cols-7 gap-1"}
          style={fullWidth ? { gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` } : undefined}
        >
          {/* Padding cells to align first day */}
          {!fullWidth &&
            paddingCells.map((i) => (
              <div key={`pad-${i}`} className="habit-grid-cell" style={{ background: "transparent" }} />
            ))}

          {cells.map((cell, idx) => {
            const isFuture = cell.date > todayStr;
            const color    = cellColor(cell.completed, isFuture);
            const isToday  = cell.date === todayStr;

            if (fullWidth) {
              /* In full-width mode we render the grid row-by-row; padding is built into columns */
              const absoluteCol = firstDay + idx;
              const row = Math.floor(absoluteCol / 7);
              const col = absoluteCol % 7;

              /* Only render on correct col position (CSS grid handles it via order if needed) */
              return (
                <Tooltip.Root key={cell.date}>
                  <Tooltip.Trigger asChild>
                    <div
                      className="habit-grid-cell"
                      style={{
                        gridColumn: col + 1,
                        gridRow: row + 1,
                        background: color,
                        outline: isToday ? "2px solid #FF6B2B" : "none",
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
                      <span className="font-medium text-text-primary">{formatDateLabel(cell.date)}</span>
                      {" — "}
                      <span
                        style={{
                          color:
                            cell.completed === null ? "#87857F"
                            : cell.completed           ? "#22C55E"
                            :                            "#EF4444",
                        }}
                      >
                        {completionLabel(cell.completed)}
                      </span>
                      <Tooltip.Arrow className="fill-forge-border" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              );
            }

            return (
              <Tooltip.Root key={cell.date}>
                <Tooltip.Trigger asChild>
                  <div
                    className="habit-grid-cell"
                    style={{
                      background: color,
                      outline: isToday ? "2px solid #FF6B2B" : "none",
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
                    <span className="font-medium text-text-primary">{formatDateLabel(cell.date)}</span>
                    {" — "}
                    <span
                      style={{
                        color:
                          cell.completed === null ? "#87857F"
                          : cell.completed           ? "#22C55E"
                          :                            "#EF4444",
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
