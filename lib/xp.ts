import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import { getLevelFromXP, getLevelName } from "@/lib/level";
export { getLevelFromXP, getLevelName, type LevelInfo } from "@/lib/level";

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
  const userRef = adminDb.collection("users").doc(userId);

  await adminDb.collection("xp_events").add({
    userId,
    xpAmount: amount,
    reason,
    eventType,
    createdAt: new Date().toISOString(),
  });

  const userSnap = await userRef.get();
  const oldXP: number = userSnap.data()?.xp ?? 0;
  const newXP = oldXP + amount;
  const oldLevel = getLevelFromXP(oldXP).level;
  const newLevelInfo = getLevelFromXP(newXP);
  const leveledUp = newLevelInfo.level > oldLevel;

  const update: Record<string, unknown> = { xp: newXP, updatedAt: new Date().toISOString() };
  if (leveledUp) update.level = newLevelInfo.level;
  await userRef.update(update);

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
