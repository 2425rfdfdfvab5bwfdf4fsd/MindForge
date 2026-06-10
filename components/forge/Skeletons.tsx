const pulse = "animate-pulse bg-[#2A2927] rounded";

export function SkeletonHabitCard() {
  return (
    <div className="bg-[#111110] p-5 animate-pulse" style={{ border: "1px solid #1A1918", borderLeft: "3px solid #2A2927" }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/3 rounded bg-[#2A2927]" />
          <div className="h-3 w-1/3 rounded bg-[#2A2927]" />
        </div>
        <div className="flex gap-2">
          <div className="h-[44px] w-24 rounded bg-[#2A2927]" />
          <div className="h-[44px] w-20 rounded bg-[#2A2927]" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonForgeScore() {
  return (
    <div className="flex flex-col items-center gap-2 animate-pulse py-4">
      <div className="h-3 w-20 rounded bg-[#2A2927]" />
      <div className="h-16 w-28 rounded bg-[#2A2927]" />
      <div className="h-3 w-12 rounded bg-[#2A2927]" />
    </div>
  );
}

export function SkeletonXPBar() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="flex justify-between">
        <div className="h-3 w-28 rounded bg-[#2A2927]" />
        <div className="h-3 w-20 rounded bg-[#2A2927]" />
      </div>
      <div className="h-2 w-full rounded bg-[#2A2927]" />
    </div>
  );
}

export function SkeletonCheckinCard() {
  return (
    <div className="bg-[#111110] border border-[#2A2927] rounded-xl p-5 animate-pulse">
      <div className={`${pulse} h-5 w-40 mb-3`} />
      <div className={`${pulse} h-3 w-full mb-2`} />
      <div className={`${pulse} h-3 w-3/4 mb-4`} />
      <div className={`${pulse} h-[44px] w-36`} />
    </div>
  );
}

export function SkeletonChallengeCard() {
  return (
    <div className="bg-[#111110] border border-[#2A2927] rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className={`${pulse} h-4 w-36 mb-2`} />
          <div className={`${pulse} h-3 w-24`} />
        </div>
        <div className={`${pulse} h-6 w-14`} />
      </div>
      <div className={`${pulse} h-3 w-full mb-1.5`} />
      <div className={`${pulse} h-3 w-4/5 mb-4`} />
      <div className={`${pulse} h-[44px] w-full`} />
    </div>
  );
}

export function SkeletonCookieJarEntry() {
  return (
    <div className="bg-[#111110] border border-[#2A2927] rounded-xl p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className={`${pulse} h-4 w-4 mt-0.5 flex-shrink-0`} />
        <div className="flex-1">
          <div className={`${pulse} h-4 w-48 mb-2`} />
          <div className={`${pulse} h-3 w-full mb-1`} />
          <div className={`${pulse} h-3 w-3/4`} />
        </div>
      </div>
    </div>
  );
}
