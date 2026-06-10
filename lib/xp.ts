export interface LevelInfo {
  level: number;
  name: string;
  xpStart: number;
  xpEnd: number; // exclusive (or Infinity for last)
  progressPct: number; // 0–100 within this level band
}

const LEVELS: Array<{ level: number; name: string; xpStart: number; xpEnd: number }> = [
  { level: 1, name: "Raw",         xpStart: 0,      xpEnd: 500 },
  { level: 2, name: "Tempered",    xpStart: 500,    xpEnd: 1500 },
  { level: 3, name: "Forged",      xpStart: 1500,   xpEnd: 3500 },
  { level: 4, name: "Hardened",    xpStart: 3500,   xpEnd: 7500 },
  { level: 5, name: "Unbreakable", xpStart: 7500,   xpEnd: 15000 },
  { level: 6, name: "Legendary",   xpStart: 15000,  xpEnd: Infinity },
];

export function getLevelFromXP(xp: number): LevelInfo {
  const safe = Math.max(0, xp);

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const tier = LEVELS[i];
    if (safe >= tier.xpStart) {
      const bandSize = tier.xpEnd === Infinity ? 15000 : tier.xpEnd - tier.xpStart;
      const progress = safe - tier.xpStart;
      const progressPct = tier.xpEnd === Infinity
        ? Math.min(100, (progress / bandSize) * 100)
        : Math.min(100, (progress / bandSize) * 100);
      return { ...tier, progressPct };
    }
  }

  return { ...LEVELS[0], progressPct: 0 };
}

export function getLevelName(level: number): string {
  return LEVELS.find((l) => l.level === level)?.name ?? "Legendary";
}
