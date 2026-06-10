import { db } from "@/server/db";
import { habitCompletions, habitStreaks } from "@/shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function recalculateStreak(
  habitId: string,
  userId: string,
  localDate: string
): Promise<number> {
  const cutoff = new Date(localDate);
  cutoff.setDate(cutoff.getDate() - 60);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const completions = await db
    .select({
      localDate: habitCompletions.localDate,
      completed: habitCompletions.completed,
    })
    .from(habitCompletions)
    .where(
      and(
        eq(habitCompletions.habitId, habitId),
        gte(habitCompletions.localDate, cutoffStr),
        lte(habitCompletions.localDate, localDate)
      )
    )
    .orderBy(desc(habitCompletions.localDate));

  if (!completions.length) {
    await db
      .update(habitStreaks)
      .set({ currentStreak: 0, updatedAt: new Date() })
      .where(eq(habitStreaks.habitId, habitId));
    return 0;
  }

  const completedDates = new Set(
    completions
      .filter((c) => c.completed)
      .map((c) => c.localDate as string)
  );

  let streak = 0;
  const cursor = new Date(localDate);
  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (dateStr > localDate) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (completedDates.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
    if (streak > 60) break;
  }

  const [existing] = await db
    .select({ longestStreak: habitStreaks.longestStreak })
    .from(habitStreaks)
    .where(eq(habitStreaks.habitId, habitId))
    .limit(1);

  const longest = Math.max(streak, existing?.longestStreak ?? 0);
  const lastCompleted = completedDates.has(localDate) ? localDate : null;

  await db
    .update(habitStreaks)
    .set({
      currentStreak: streak,
      longestStreak: longest,
      lastCompletedDate: lastCompleted,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(habitStreaks.habitId, habitId),
        eq(habitStreaks.userId, userId)
      )
    );

  return streak;
}

export { recalculateForgeScore } from "@/lib/forge-score";
