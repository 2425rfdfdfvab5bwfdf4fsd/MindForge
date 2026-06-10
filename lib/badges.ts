import { db } from "@/server/db";
import {
  userBadges,
  dailyCheckins,
  cookieJarEntries,
  ruleFortyEvents,
  userChallenges,
  challenges,
} from "@/shared/schema";
import { eq, and, gte, count, inArray } from "drizzle-orm";

export const BADGE_KEYS = [
  "identity_locked",
  "mirror_gazer",
  "cookie_jar_founder",
  "forty_percent_survivor",
  "cold_mind",
  "tempered",
] as const;

export type BadgeKey = (typeof BADGE_KEYS)[number];

export async function checkAndAwardBadge(
  userId: string,
  badgeKey: BadgeKey
): Promise<{ awarded: boolean }> {
  const [existing] = await db
    .select({ id: userBadges.id })
    .from(userBadges)
    .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeKey, badgeKey)))
    .limit(1);

  if (existing) return { awarded: false };

  try {
    await db.insert(userBadges).values({ userId, badgeKey });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "23505") return { awarded: false };
    throw err;
  }

  return { awarded: true };
}

export async function checkMirrorGazer(
  userId: string
): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const rows = await db
    .select({ localDate: dailyCheckins.localDate })
    .from(dailyCheckins)
    .where(
      and(
        eq(dailyCheckins.userId, userId),
        eq(dailyCheckins.onboardingMirror, false),
        gte(dailyCheckins.localDate, thirtyDaysAgo)
      )
    )
    .orderBy(dailyCheckins.localDate);

  if (rows.length < 30) return;

  const dates = new Set(rows.map((r) => r.localDate as string));
  const today = new Date();
  let consecutive = true;

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (!dates.has(key)) { consecutive = false; break; }
  }

  if (consecutive) await checkAndAwardBadge(userId, "mirror_gazer");
}

export async function checkCookieJarFounder(userId: string): Promise<void> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(cookieJarEntries)
    .where(eq(cookieJarEntries.userId, userId));
  if (value >= 10) await checkAndAwardBadge(userId, "cookie_jar_founder");
}

export async function checkFortyPercentSurvivor(userId: string): Promise<void> {
  const [{ value }] = await db
    .select({ value: count() })
    .from(ruleFortyEvents)
    .where(and(eq(ruleFortyEvents.userId, userId), eq(ruleFortyEvents.choice, "took_step")));
  if (value >= 5) await checkAndAwardBadge(userId, "forty_percent_survivor");
}

export async function checkColdMind(userId: string): Promise<void> {
  const coldChallenges = await db
    .select({ id: challenges.id })
    .from(challenges)
    .where(and(eq(challenges.category, "cold"), eq(challenges.isActive, true)));

  if (!coldChallenges.length) return;

  const coldIds = coldChallenges.map((c) => c.id);
  const [{ value }] = await db
    .select({ value: count() })
    .from(userChallenges)
    .where(
      and(
        eq(userChallenges.userId, userId),
        eq(userChallenges.status, "completed"),
        inArray(userChallenges.challengeId, coldIds)
      )
    );
  if (value >= 7) await checkAndAwardBadge(userId, "cold_mind");
}
