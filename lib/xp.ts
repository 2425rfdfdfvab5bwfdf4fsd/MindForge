// ---------------------------------------------------------------------------
// Pure level data — safe to import in client components
// ---------------------------------------------------------------------------

export interface LevelInfo {
  level: number;
  name: string;
  currentLevelMin: number;
  nextLevelMin: number | null;
  progressPct: number;
}

const LEVELS: Array<{ level: number; name: string; min: number; next: number | null }> = [
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

// ---------------------------------------------------------------------------
// XP event types (PRD Feature 13 — exact list, no additions)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Server-side awardXP — takes supabase client as first arg
// Never call this from client components.
// ---------------------------------------------------------------------------

export interface AwardXPResult {
  leveledUp: boolean;
  newLevel: number;
  levelName: string;
  xpAwarded: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function awardXP(
  supabase: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  userId: string,
  amount: number,
  reason: string,
  eventType: XPEventType
): Promise<AwardXPResult> {
  // Insert XP event record
  await supabase.from("xp_events").insert({
    user_id: userId,
    xp_amount: amount,
    reason,
    event_type: eventType,
  });

  // Fetch current XP total
  const { data: user } = await supabase
    .from("users")
    .select("xp")
    .eq("id", userId)
    .single();

  const oldXP: number = user?.xp ?? 0;
  const newXP = oldXP + amount;

  const oldLevel = getLevelFromXP(oldXP).level;
  const newLevelInfo = getLevelFromXP(newXP);
  const leveledUp = newLevelInfo.level > oldLevel;

  const updatePayload: Record<string, unknown> = { xp: newXP };
  if (leveledUp) updatePayload.level = newLevelInfo.level;

  await supabase.from("users").update(updatePayload).eq("id", userId);

  // Award 'tempered' badge the first time the user crosses 500 XP
  if (newXP >= 500 && oldXP < 500) {
    const { checkAndAwardBadge } = await import("./badges");
    await checkAndAwardBadge(supabase, userId, "tempered");
  }

  return {
    leveledUp,
    newLevel: newLevelInfo.level,
    levelName: newLevelInfo.name,
    xpAwarded: amount,
  };
}
