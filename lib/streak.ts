import { adminDb } from "@/lib/firebase/admin";

export async function recalculateStreak(
  habitId: string,
  userId: string,
  localDate: string
): Promise<number> {
  const cutoff = new Date(localDate);
  cutoff.setDate(cutoff.getDate() - 60);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const snap = await adminDb
    .collection("habit_completions")
    .where("habitId", "==", habitId)
    .where("localDate", ">=", cutoffStr)
    .where("localDate", "<=", localDate)
    .get();

  const completedDates = new Set(
    snap.docs
      .filter((d) => d.data().completed)
      .map((d) => d.data().localDate as string)
  );

  if (snap.empty) {
    await adminDb.collection("habit_streaks").doc(habitId).set(
      { currentStreak: 0, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    return 0;
  }

  let streak = 0;
  const cursor = new Date(localDate);
  while (streak <= 60) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (dateStr > localDate) { cursor.setDate(cursor.getDate() - 1); continue; }
    if (completedDates.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  const streakRef = adminDb.collection("habit_streaks").doc(habitId);
  const existing = await streakRef.get();
  const longest = Math.max(streak, existing.data()?.longestStreak ?? 0);
  const lastCompleted = completedDates.has(localDate) ? localDate : null;

  await streakRef.set(
    {
      habitId,
      userId,
      currentStreak: streak,
      longestStreak: longest,
      lastCompletedDate: lastCompleted,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return streak;
}

export { recalculateForgeScore } from "@/lib/forge-score";
