import { db } from "@/server/db";
import { xpEvents, users } from "@/shared/schema";
import { eq, sql } from "drizzle-orm";

export interface LevelInfo {
  level: number;
  name: string;
  currentLevelMin: number;
  nextLevelMin: number | null;
  progressPct: number;
}

const LEVELS = [
  { level: 1, name: "Raw",         min: 0,     next: 500   },
  { level: 2, name: "Tempered",    min: 500,   next: 1500  },
  { level: 3, name: "Forged",      min: 1500,  next: 3500  },
  { level: 4, name: "Hardened",    min: 3500,  next: 7500  },
  { level: 5, name: "Unbreakable", min: 7500,  next: 15000 },
  { level: 6, name: "Legendary",   min: 15000, next: null  },
];

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

export type XPEventType =
  | "habit_complete"
  | "checkin"
  | "checkin_bonus"
  | "challenge"
  | "forty_percent"
  | "cookie_jar"
  | "environment"
  | "onboarding";

export const XP_AMOUNTS = {
  habit_complete: 20,
  checkin: 30,
  checkin_bonus: 20,
  cookie_jar: 25,
  environment: 50,
  onboarding: 200,
  forty_percent: 15,
} as const;

export interface AwardXPResult {
  leveledUp: boolean;
  newLevel: number;
  levelName: string;
  xpAwarded: number;
}

export async function awardXP(
  userId: string,
  amount: number,
  reason: string,
  eventType: XPEventType
): Promise<AwardXPResult> {
  await db.insert(xpEvents).values({ userId, xpAmount: amount, reason, eventType });

  const [user] = await db
    .select({ xp: users.xp })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const oldXP = user?.xp ?? 0;
  const newXP = oldXP + amount;
  const oldLevel = getLevelFromXP(oldXP).level;
  const newLevelInfo = getLevelFromXP(newXP);
  const leveledUp = newLevelInfo.level > oldLevel;

  await db
    .update(users)
    .set({
      xp: newXP,
      ...(leveledUp ? { level: newLevelInfo.level } : {}),
    })
    .where(eq(users.id, userId));

  if (newXP >= 500 && oldXP < 500) {
    const { checkAndAwardBadge } = await import("./badges");
    await checkAndAwardBadge(userId, "tempered");
  }

  return {
    leveledUp,
    newLevel: newLevelInfo.level,
    levelName: newLevelInfo.name,
    xpAwarded: amount,
  };
}
