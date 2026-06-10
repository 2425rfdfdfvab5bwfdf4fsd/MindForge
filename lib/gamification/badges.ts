import { adminDb } from "@/lib/firebase/admin";

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
  const docRef = adminDb
    .collection("users")
    .doc(userId)
    .collection("badges")
    .doc(badgeKey);

  const existing = await docRef.get();
  if (existing.exists) return { awarded: false };

  await docRef.set({ badgeKey, earnedAt: new Date().toISOString() });
  return { awarded: true };
}

export async function checkMirrorGazer(userId: string): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const snap = await adminDb
    .collection("daily_checkins")
    .where("userId", "==", userId)
    .where("onboardingMirror", "==", false)
    .where("localDate", ">=", thirtyDaysAgo)
    .get();

  if (snap.size < 30) return;

  const dates = new Set(snap.docs.map((d) => d.data().localDate as string));
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (!dates.has(key)) return;
  }

  await checkAndAwardBadge(userId, "mirror_gazer");
}

export async function checkCookieJarFounder(userId: string): Promise<void> {
  const snap = await adminDb
    .collection("cookie_jar_entries")
    .where("userId", "==", userId)
    .get();
  if (snap.size >= 10) await checkAndAwardBadge(userId, "cookie_jar_founder");
}

export async function checkFortyPercentSurvivor(userId: string): Promise<void> {
  const snap = await adminDb
    .collection("rule_forty_events")
    .where("userId", "==", userId)
    .where("choice", "==", "took_step")
    .get();
  if (snap.size >= 5) await checkAndAwardBadge(userId, "forty_percent_survivor");
}

export async function checkColdMind(userId: string): Promise<void> {
  const coldSnap = await adminDb
    .collection("challenges")
    .where("category", "==", "cold")
    .where("isActive", "==", true)
    .get();

  if (coldSnap.empty) return;

  const coldIds = coldSnap.docs.map((d) => d.id);

  const snap = await adminDb
    .collection("user_challenges")
    .where("userId", "==", userId)
    .where("status", "==", "completed")
    .get();

  const count = snap.docs.filter((d) => coldIds.includes(d.data().challengeId)).length;
  if (count >= 7) await checkAndAwardBadge(userId, "cold_mind");
}
