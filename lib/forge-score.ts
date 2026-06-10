import "server-only";
import { db } from "@/server/db";
import {
  habits,
  habitStreaks,
  dailyCheckins,
  userChallenges,
  challenges,
  cookieJarEntries,
  environmentAuditItems,
  users,
  forgeScoreHistory,
} from "@/shared/schema";
import { eq, and, gte, isNotNull, count } from "drizzle-orm";

function calcStreakConsistency(
  rows: Array<{ currentStreak: number | null; longestStreak: number | null }>
): number {
  if (!rows.length) return 0;
  const ratios = rows.map((h) => {
    const current = h.currentStreak ?? 0;
    const longest = Math.max(h.longestStreak ?? 0, 7);
    return Math.min(current / longest, 1.0);
  });
  const avg = ratios.reduce((s, r) => s + r, 0) / ratios.length;
  return Math.floor(avg * 400);
}

function calcCheckinHonesty(
  rows: Array<{ honestyScore: number | null }>
): number {
  const scored = rows.filter((c) => c.honestyScore !== null);
  if (!scored.length) return 0;
  const avg =
    scored.reduce((s, c) => s + (c.honestyScore! / 10), 0) / scored.length;
  return Math.floor(avg * 200);
}

function calcChallengeCompletion(
  completedCount: number,
  totalActive: number
): number {
  const ratio = Math.min(completedCount / Math.max(totalActive, 1), 1.0);
  return Math.floor(ratio * 200);
}

function calcCookieJar(total: number): number {
  return Math.floor(Math.min(total / 20, 1.0) * 100);
}

function calcEnvironmentImprovements(
  rows: Array<{ done: boolean }>
): number {
  if (!rows.length) return 0;
  const done = rows.filter((i) => i.done).length;
  return Math.floor(Math.min(done / Math.max(rows.length, 1), 1.0) * 100);
}

export async function recalculateForgeScore(userId: string): Promise<number> {
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [
    habitsWithStreaks,
    checkinRows,
    completedChallengesRows,
    activeChallengesCount,
    cookieJarCount,
    auditRows,
  ] = await Promise.all([
    db
      .select({
        currentStreak: habitStreaks.currentStreak,
        longestStreak: habitStreaks.longestStreak,
      })
      .from(habits)
      .leftJoin(habitStreaks, eq(habitStreaks.habitId, habits.id))
      .where(and(eq(habits.userId, userId), eq(habits.isActive, true))),

    db
      .select({ honestyScore: dailyCheckins.honestyScore })
      .from(dailyCheckins)
      .where(
        and(
          eq(dailyCheckins.userId, userId),
          eq(dailyCheckins.onboardingMirror, false),
          gte(dailyCheckins.localDate, fourteenDaysAgo),
          isNotNull(dailyCheckins.honestyScore)
        )
      ),

    db
      .select({ id: userChallenges.id })
      .from(userChallenges)
      .where(
        and(
          eq(userChallenges.userId, userId),
          eq(userChallenges.status, "completed"),
          gte(userChallenges.completedAt, monthStart)
        )
      ),

    db
      .select({ value: count() })
      .from(challenges)
      .where(eq(challenges.isActive, true)),

    db
      .select({ value: count() })
      .from(cookieJarEntries)
      .where(eq(cookieJarEntries.userId, userId)),

    db
      .select({ done: environmentAuditItems.done })
      .from(environmentAuditItems)
      .where(eq(environmentAuditItems.userId, userId)),
  ]);

  const c1 = calcStreakConsistency(habitsWithStreaks);
  const c2 = calcCheckinHonesty(checkinRows);
  const c3 = calcChallengeCompletion(
    completedChallengesRows.length,
    activeChallengesCount[0]?.value ?? 0
  );
  const c4 = calcCookieJar(cookieJarCount[0]?.value ?? 0);
  const c5 = calcEnvironmentImprovements(auditRows);

  const total = Math.min(Math.max(Math.floor(c1 + c2 + c3 + c4 + c5), 0), 1000);

  await Promise.all([
    db.update(users).set({ forgeScore: total }).where(eq(users.id, userId)),
    db.insert(forgeScoreHistory).values({ userId, score: total }),
  ]);

  return total;
}
