export function SkeletonHabitCard() {
  return (
    <div
      className="bg-[#111110] p-5 animate-pulse"
      style={{ border: "1px solid #1A1918", borderLeft: "3px solid #2A2927" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/3 rounded bg-forge-border" />
          <div className="h-3 w-1/3 rounded bg-forge-border" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded bg-forge-border" />
          <div className="h-8 w-20 rounded bg-forge-border" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonForgeScore() {
  return (
    <div className="flex flex-col items-center gap-2 animate-pulse py-4">
      <div className="h-3 w-20 rounded bg-forge-border" />
      <div className="h-16 w-28 rounded bg-forge-border" />
      <div className="h-3 w-12 rounded bg-forge-border" />
    </div>
  );
}

export function SkeletonXPBar() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="flex justify-between">
        <div className="h-3 w-28 rounded bg-forge-border" />
        <div className="h-3 w-20 rounded bg-forge-border" />
      </div>
      <div className="h-2 w-full rounded bg-forge-border" />
    </div>
  );
}
