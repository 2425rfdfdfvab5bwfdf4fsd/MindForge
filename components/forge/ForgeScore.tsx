"use client";

import { useEffect, useRef } from "react";
import { useSpring, useTransform, motion } from "framer-motion";
import { getLevelName } from "@/lib/gamification/level";

interface ForgeScoreProps {
  score: number;
  level?: number;
  compact?: boolean;
}

export function ForgeScore({ score, level = 1, compact = false }: ForgeScoreProps) {
  const springValue = useSpring(score, { duration: 500, bounce: 0 });
  const displayed = useTransform(springValue, (v) => Math.round(v));
  const glowRef = useRef<HTMLDivElement>(null);
  const prevScore = useRef(score);

  useEffect(() => {
    springValue.set(score);

    if (score > prevScore.current && glowRef.current) {
      glowRef.current.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 800, easing: "ease-out" }
      );
    }
    prevScore.current = score;
  }, [score, springValue]);

  if (compact) {
    return (
      <div className="flex flex-col items-end">
        <span className="hidden lg:block font-mono text-xs tracking-widest text-text-muted uppercase">
          Forge Score
        </span>
        <motion.span className="font-heading tabular-nums text-4xl lg:text-xl font-bold text-text-primary">
          {displayed}
        </motion.span>
      </div>
    );
  }

  return (
    <div className="relative inline-flex flex-col items-center">
      {/* Glow layer — animates via Web Animations API on score increase */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{ boxShadow: "0 0 40px 12px rgba(255,107,43,0.15)" }}
      />
      <span className="font-mono text-xs tracking-widest text-text-muted uppercase">
        Forge Score
      </span>
      <motion.span className="font-heading tabular-nums text-display font-bold text-text-primary leading-none">
        {displayed}
      </motion.span>
      <span className="mt-1 text-xs text-text-muted">{getLevelName(level)}</span>
    </div>
  );
}
