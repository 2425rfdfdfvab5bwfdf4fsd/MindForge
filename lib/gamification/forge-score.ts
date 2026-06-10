import "server-only";
import { adminDb } from "@/lib/firebase/admin";

function calcStreakConsistency(
  rows: Array<{ currentStreak: number; longestStreak: number }>
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

function calcCheckinHonesty(scores: number[]): number {
  if (!scores.length) return 0;
  const avg = scores.reduce((s, c) => s + c / 10, 0) / scores.length;
  return Math.floor(avg * 200);
}

function calcChallengeCompletion(completedCount: number, totalActive: number): number {
  const ratio = Math.min(completedCount / Math.max(totalActive, 1), 1.0);
  return Math.floor(ratio * 200);
}

function calcCookieJar(total: number): number {
  return Math.floor(Math.min(total / 20, 1.0) * 100);
}

function calcEnvironmentImprovements(total: number, done: number): number {
  if (!total) return 0;
  return Math.floor(Math.min(done / total, 1.0) * 100);
}

export async function recalculateForgeScore(userId: string): Promise<number> {
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();

  const [
    habitsSnap,
    checkinSnap,
    completedChalSnap,
    allChalSnap,
    cookieSnap,
    auditSnap,
  ] = await Promise.all([
    adminDb.collection("habits").where("userId", "==", userId).where("isActive", "==", true).get(),
    adminDb.collection("daily_checkins").where("userId", "==", userId).where("onboardingMirror", "==", false).where("localDate", ">=", fourteenDaysAgo).get(),
    adminDb.collection("user_challenges").where("userId", "==", userId).where("status", "==", "completed").where("completedAt", ">=", monthStart).get(),
    adminDb.collection("challenges").where("isActive", "==", true).get(),
    adminDb.collection("cookie_jar_entries").where("userId", "==", userId).get(),
    adminDb.collection("environment_audit_items").where("userId", "==", userId).get(),
  ]);

  const habitIds = habitsSnap.docs.map((d) => d.id);

  let streakRows: Array<{ currentStreak: number; longestStreak: number }> = [];
  if (habitIds.length) {
    const streakSnaps = await Promise.all(
      habitIds.map((hid) => adminDb.collection("habit_streaks").doc(hid).get())
    );
    streakRows = streakSnaps
      .filter((s) => s.exists)
      .map((s) => ({
        currentStreak: s.data()?.currentStreak ?? 0,
        longestStreak: s.data()?.longestStreak ?? 0,
      }));
  }

  const honestyScores = checkinSnap.docs
    .map((d) => d.data().honestyScore as number | null)
    .filter((s): s is number => s !== null);

  const c1 = calcStreakConsistency(streakRows);
  const c2 = calcCheckinHonesty(honestyScores);
  const c3 = calcChallengeCompletion(completedChalSnap.size, allChalSnap.size);
  const c4 = calcCookieJar(cookieSnap.size);
  const doneCount = auditSnap.docs.filter((d) => d.data().done).length;
  const c5 = calcEnvironmentImprovements(auditSnap.size, doneCount);

  const total = Math.min(Math.max(Math.floor(c1 + c2 + c3 + c4 + c5), 0), 1000);

  await Promise.all([
    adminDb.collection("users").doc(userId).update({ forgeScore: total, updatedAt: new Date().toISOString() }),
    adminDb.collection("forge_score_history").add({ userId, score: total, recordedAt: new Date().toISOString() }),
  ]);

  return total;
}
