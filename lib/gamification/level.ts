// Pure level utilities — no server-only dependencies, safe to import in Client Components

export interface LevelInfo {
  level: number;
  name: string;
  currentLevelMin: number;
  nextLevelMin: number | null;
  progressPct: number;
}

export const LEVELS = [
  { level: 1, name: "Raw",          min: 0,     next: 500   },
  { level: 2, name: "Tempered",     min: 500,   next: 1500  },
  { level: 3, name: "Forged",       min: 1500,  next: 3500  },
  { level: 4, name: "Hardened",     min: 3500,  next: 7500  },
  { level: 5, name: "Unbreakable",  min: 7500,  next: 15000 },
  { level: 6, name: "Legendary",    min: 15000, next: null  },
] as const;

export function getLevelFromXP(xp: number): LevelInfo {
  const safe = Math.max(0, xp);
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const tier = LEVELS[i];
    if (safe >= tier.min) {
      const progressPct =
        tier.next === null
          ? 100
          : Math.min(100, ((safe - tier.min) / (tier.next - tier.min)) * 100);
      return {
        level: tier.level,
        name: tier.name,
        currentLevelMin: tier.min,
        nextLevelMin: tier.next,
        progressPct,
      };
    }
  }
  return { level: 1, name: "Raw", currentLevelMin: 0, nextLevelMin: 500, progressPct: 0 };
}

export function getLevelName(level: number): string {
  return LEVELS.find((l) => l.level === level)?.name ?? "Legendary";
}
