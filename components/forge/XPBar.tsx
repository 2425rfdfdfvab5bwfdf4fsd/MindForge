"use client";

import { useEffect, useRef, useState } from "react";
import { getLevelFromXP } from "@/lib/level";

interface XPBarProps {
  xp: number;
}

export function XPBar({ xp }: XPBarProps) {
  const info = getLevelFromXP(xp);
  const [displayPct, setDisplayPct] = useState(0);
  const [leveledUp, setLeveledUp] = useState(false);
  const prevLevelRef = useRef(info.level);
  const prevPctRef = useRef(0);
  const animFrameRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const newLevel = info.level;
    const newPct = info.progressPct;

    if (newLevel > prevLevelRef.current) {
      // Level-up animation: fill → pause → reset → fill
      setLeveledUp(true);
      setDisplayPct(100);
      animFrameRef.current = setTimeout(() => {
        setDisplayPct(0);
        animFrameRef.current = setTimeout(() => {
          setLeveledUp(false);
          setDisplayPct(newPct);
        }, 80); // instant reset then fill
      }, 200);
    } else {
      setDisplayPct(newPct);
    }

    prevLevelRef.current = newLevel;
    prevPctRef.current = newPct;

    return () => {
      if (animFrameRef.current) clearTimeout(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xp]);

  const nextLevel = info.nextLevelMin;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          Level {info.level} — {info.name}
        </span>
        {nextLevel && (
          <span className="text-xs tabular-nums text-text-muted">
            {xp.toLocaleString()} / {nextLevel.toLocaleString()} XP
          </span>
        )}
        {!nextLevel && (
          <span className="text-xs text-forge-orange">MAX</span>
        )}
      </div>

      <div className="h-2 w-full bg-[#2A2927]">
        <div
          className={`h-full bg-forge-orange ${leveledUp ? "" : ""}`}
          style={{
            width: `${displayPct}%`,
            transition: leveledUp
              ? "width 200ms cubic-bezier(0.16, 1, 0.3, 1)"
              : "width 300ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </div>
    </div>
  );
}
