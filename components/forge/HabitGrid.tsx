"use client";

import * as Tooltip from "@radix-ui/react-tooltip";

interface DayCell {
  date: string;
  completed: boolean | null;
}

interface HabitGridProps {
  history: { localDate: string; completed: boolean }[];
  fullWidth?: boolean;
  /** User's local today as 'YYYY-MM-DD'. Falls back to browser local date. */
  todayLocalDate?: string;
}

const DAY_LABELS  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function buildGrid(
  history: HabitGridProps["history"],
  todayStr: string
): DayCell[] {
  const map = new Map(history.map((h) => [h.localDate, h.completed]));
  const cells: DayCell[] = [];
  // Use noon to avoid DST edge-cases when subtracting days.
  const anchor = new Date(todayStr + "T12:00:00");
  for (let i = 89; i >= 0; i--) {
    const d = new Date(anchor);
    d.setDate(d.getDate() - i);
    // en-CA locale gives YYYY-MM-DD format — same shape as localDate in Firestore.
    const s = d.toLocaleDateString("en-CA");
    cells.push({ date: s, completed: map.has(s) ? map.get(s)! : null });
  }
  return cells;
}

function cellColor(completed: boolean | null): string {
  if (completed === null) return "var(--cell-empty)";
  return completed ? "#22C55E" : "#EF4444";
}

function formatDateLabel(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

function completionLabel(completed: boolean | null): string {
  if (completed === null) return "No data";
  return completed ? "Completed" : "Missed";
}

function TooltipCell({
  cell,
  isToday,
  style,
  className,
}: {
  cell: DayCell;
  isToday: boolean;
  style?: React.CSSProperties;
  className?: string;
}) {
  const color = cellColor(cell.completed);
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <div
          className={`habit-grid-cell${className ? ` ${className}` : ""}`}
          style={{
            background: color,
            outline: isToday ? "2px solid #FF6B2B" : "none",
            outlineOffset: "1px",
            ...style,
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
              color: cell.completed === null ? "#87857F" : cell.completed ? "#22C55E" : "#EF4444",
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

/* ────────────────────────────────────────────────────────────
   TRANSPOSED LAYOUT (large screens)
   Rows = days of week  |  Columns = weeks
   Day labels on the LEFT
──────────────────────────────────────────────────────────── */
function TransposedGrid({ cells, firstDay, todayStr }: {
  cells: DayCell[];
  firstDay: number;
  todayStr: string;
}) {
  const numWeeks = Math.ceil((firstDay + cells.length) / 7);

  /* Build a week→month label map for the top header */
  const monthByWeek: Map<number, string> = new Map();
  cells.forEach((cell, i) => {
    const absPos = firstDay + i;
    const week   = Math.floor(absPos / 7);
    const d      = new Date(cell.date + "T12:00:00");
    const label  = MONTH_NAMES[d.getMonth()];
    if (!monthByWeek.has(week)) {
      const weekStartDayOfMonth = new Date(cell.date + "T12:00:00").getDate();
      if (weekStartDayOfMonth <= 7) monthByWeek.set(week, label);
    }
  });

  /* Build cell lookup: [week][dayOfWeek] = DayCell | null */
  const grid: (DayCell | null)[][] = Array.from({ length: numWeeks }, () =>
    Array(7).fill(null)
  );
  cells.forEach((cell, i) => {
    const absPos    = firstDay + i;
    const week      = Math.floor(absPos / 7);
    const dayOfWeek = absPos % 7;
    grid[week][dayOfWeek] = cell;
  });

  return (
    <div className="w-full">
      {/* Month labels row */}
      <div
        className="mb-1 flex"
        style={{ paddingLeft: "2.25rem" }}
      >
        <div
          className="grid flex-1"
          style={{ gridTemplateColumns: `repeat(${numWeeks}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: numWeeks }, (_, w) => (
            <span
              key={w}
              className="truncate text-[10px] font-medium tracking-wider text-text-disabled"
            >
              {monthByWeek.get(w) ?? ""}
            </span>
          ))}
        </div>
      </div>

      {/* Main grid: day labels on left + week columns */}
      <div className="flex gap-0">
        {/* Day labels column */}
        <div className="mr-1.5 flex flex-col" style={{ width: "1.875rem" }}>
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="flex flex-1 items-center justify-end pr-1 text-[10px] font-medium uppercase tracking-wider text-text-muted"
              style={{ minHeight: "0.875rem" }}
            >
              {d.slice(0, 1)}
            </div>
          ))}
        </div>

        {/* Week columns grid */}
        <div
          className="grid flex-1 gap-1"
          style={{
            gridTemplateColumns: `repeat(${numWeeks}, minmax(0, 1fr))`,
            gridTemplateRows:    "repeat(7, minmax(0, 1fr))",
          }}
        >
          {grid.map((week, w) =>
            week.map((cell, d) =>
              cell ? (
                <TooltipCell
                  key={cell.date}
                  cell={cell}
                  isToday={cell.date === todayStr}
                  style={{ gridColumn: w + 1, gridRow: d + 1 }}
                />
              ) : (
                <div
                  key={`empty-${w}-${d}`}
                  style={{ gridColumn: w + 1, gridRow: d + 1, background: "transparent" }}
                />
              )
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   COMPACT LAYOUT (small / medium screens)
   7 columns (days of week), weeks fill downward
   Day labels at the TOP
──────────────────────────────────────────────────────────── */
function CompactGrid({ cells, firstDay, todayStr }: {
  cells: DayCell[];
  firstDay: number;
  todayStr: string;
}) {
  const paddingCells = Array.from({ length: firstDay }, (_, i) => i);
  return (
    <div className="w-full max-w-[300px]">
      <div className="mb-1.5 grid grid-cols-7 gap-1">
        {DAY_LABELS.map((d, i) => (
          <span
            key={i}
            className="text-center text-[10px] font-medium uppercase tracking-wider text-text-muted"
          >
            {d.slice(0, 1)}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {paddingCells.map((i) => (
          <div key={`pad-${i}`} className="habit-grid-cell" style={{ background: "transparent" }} />
        ))}
        {cells.map((cell) => (
          <TooltipCell
            key={cell.date}
            cell={cell}
            isToday={cell.date === todayStr}
          />
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   PUBLIC EXPORT
──────────────────────────────────────────────────────────── */
export function HabitGrid({ history, fullWidth = false, todayLocalDate }: HabitGridProps) {
  // Prefer the explicitly provided local date; fall back to browser local date.
  // Using toLocaleDateString("en-CA") gives YYYY-MM-DD in the browser's timezone,
  // which is far better than the UTC date from toISOString().slice(0,10).
  const todayStr = todayLocalDate ?? new Date().toLocaleDateString("en-CA");
  const cells    = buildGrid(history, todayStr);
  const firstDay = new Date(cells[0].date + "T12:00:00").getDay();

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

      {fullWidth ? (
        <>
          {/* Transposed layout — large screens */}
          <div className="hidden lg:block">
            <TransposedGrid cells={cells} firstDay={firstDay} todayStr={todayStr} />
          </div>
          {/* Compact layout — small / medium screens */}
          <div className="lg:hidden">
            <CompactGrid cells={cells} firstDay={firstDay} todayStr={todayStr} />
          </div>
        </>
      ) : (
        <CompactGrid cells={cells} firstDay={firstDay} todayStr={todayStr} />
      )}
    </Tooltip.Provider>
  );
}
