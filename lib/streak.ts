// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recalculateStreak(
  supabase: any,
  habitId: string,
  userId: string,
  localDate: string
): Promise<number> {
  // Fetch last 60 days of completions, newest first
  const cutoff = new Date(localDate);
  cutoff.setDate(cutoff.getDate() - 60);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const { data: completions } = await supabase
    .from("habit_completions")
    .select("local_date, completed")
    .eq("habit_id", habitId)
    .gte("local_date", cutoffStr)
    .lte("local_date", localDate)
    .order("local_date", { ascending: false });

  if (!completions || completions.length === 0) {
    await supabase
      .from("habit_streaks")
      .update({ current_streak: 0, updated_at: new Date().toISOString() })
      .eq("habit_id", habitId);
    return 0;
  }

  // Build a Set of completed dates for O(1) lookup
  const completedDates = new Set(
    completions
      .filter((c: { local_date: string; completed: boolean }) => c.completed)
      .map((c: { local_date: string }) => c.local_date)
  );

  // Walk back from localDate counting consecutive completed days
  let streak = 0;
  const cursor = new Date(localDate);

  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (dateStr > localDate) {
      // skip future
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    if (completedDates.has(dateStr)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
    // Safety — only go back 60 days
    if (streak > 60) break;
  }

  // Fetch existing longest streak
  const { data: existing } = await supabase
    .from("habit_streaks")
    .select("longest_streak")
    .eq("habit_id", habitId)
    .single();

  const longest = Math.max(streak, existing?.longest_streak ?? 0);
  const lastCompleted = completedDates.has(localDate) ? localDate : null;

  await supabase
    .from("habit_streaks")
    .update({
      current_streak: streak,
      longest_streak: longest,
      last_completed_date: lastCompleted,
      updated_at: new Date().toISOString(),
    })
    .eq("habit_id", habitId)
    .eq("user_id", userId);

  return streak;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function recalculateForgeScore(supabase: any, userId: string): Promise<void> {
  // Sum all XP events to get total XP, then store forge_score = xp
  // (ForgeScore display reads this field directly)
  const { data: user } = await supabase
    .from("users")
    .select("xp")
    .eq("id", userId)
    .single();

  if (!user) return;

  // forge_score is a rounded composite — for now 1:1 with XP
  await supabase
    .from("users")
    .update({ forge_score: user.xp })
    .eq("id", userId);
}
