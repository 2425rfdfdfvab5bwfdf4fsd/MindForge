import "server-only";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

interface HabitWithStreak {
  habit_streaks: Array<{ current_streak: number; longest_streak: number }>;
}
interface Checkin {
  honesty_score: number | null;
}
interface UserChallenge {
  id: string;
}
interface AuditItem {
  done: boolean;
}

// ---------------------------------------------------------------------------
// Individual component calculators
// ---------------------------------------------------------------------------

function calcStreakConsistency(habits: HabitWithStreak[]): number {
  if (!habits.length) return 0;
  const ratios = habits.map((h) => {
    const streak = h.habit_streaks?.[0];
    const current = streak?.current_streak ?? 0;
    const longest = Math.max(streak?.longest_streak ?? 0, 7);
    return Math.min(current / longest, 1.0);
  });
  const avg = ratios.reduce((s, r) => s + r, 0) / ratios.length;
  return Math.floor(avg * 400);
}

function calcCheckinHonesty(checkins: Checkin[]): number {
  const scored = checkins.filter((c) => c.honesty_score !== null);
  if (!scored.length) return 0;
  const avg =
    scored.reduce((s, c) => s + (c.honesty_score! / 10), 0) / scored.length;
  return Math.floor(avg * 200);
}

function calcChallengeCompletion(
  completedCount: number,
  totalActive: number
): number {
  const ratio = Math.min(completedCount / Math.max(totalActive, 1), 1.0);
  return Math.floor(ratio * 200);
}

function calcCookieJar(count: number): number {
  const ratio = Math.min(count / 20, 1.0);
  return Math.floor(ratio * 100);
}

function calcEnvironmentImprovements(auditItems: AuditItem[]): number {
  if (!auditItems.length) return 0;
  const done = auditItems.filter((i) => i.done).length;
  const ratio = Math.min(done / Math.max(auditItems.length, 1), 1.0);
  return Math.floor(ratio * 100);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function recalculateForgeScore(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  // Start of current calendar month (UTC)
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();

  // 14 days ago for honesty window
  const fourteenDaysAgo = new Date(
    now.getTime() - 14 * 24 * 60 * 60 * 1000
  ).toISOString().split("T")[0];

  // Single Promise.all — no N+1
  const [
    habitsResult,
    checkinsResult,
    completedChallengesResult,
    activeChallengesResult,
    cookieJarResult,
    auditItemsResult,
  ] = await Promise.all([
    // Component 1 — active habits with their streak data
    supabase
      .from("habits")
      .select("id, habit_streaks(current_streak, longest_streak)")
      .eq("user_id", userId)
      .eq("is_active", true),

    // Component 2 — last 14 days of honesty scores
    supabase
      .from("daily_checkins")
      .select("honesty_score")
      .eq("user_id", userId)
      .eq("onboarding_mirror", false)
      .gte("local_date", fourteenDaysAgo)
      .not("honesty_score", "is", null),

    // Component 3a — challenges completed this calendar month
    supabase
      .from("user_challenges")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("completed_at", monthStart),

    // Component 3b — total active challenges
    supabase
      .from("challenges")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),

    // Component 4 — cookie jar count
    supabase
      .from("cookie_jar_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),

    // Component 5 — environment audit items
    supabase
      .from("environment_audit_items")
      .select("done")
      .eq("user_id", userId),
  ]);

  const habits = (habitsResult.data ?? []) as HabitWithStreak[];
  const checkins = (checkinsResult.data ?? []) as Checkin[];
  const completedChallenges = (completedChallengesResult.data ?? []) as UserChallenge[];
  const activeChallengesCount = activeChallengesResult.count ?? 0;
  const cookieJarCount = cookieJarResult.count ?? 0;
  const auditItems = (auditItemsResult.data ?? []) as AuditItem[];

  // Compute each component
  const c1 = calcStreakConsistency(habits);
  const c2 = calcCheckinHonesty(checkins);
  const c3 = calcChallengeCompletion(completedChallenges.length, activeChallengesCount);
  const c4 = calcCookieJar(cookieJarCount);
  const c5 = calcEnvironmentImprovements(auditItems);

  const total = Math.min(Math.max(Math.floor(c1 + c2 + c3 + c4 + c5), 0), 1000);

  // Persist — fire in parallel
  await Promise.all([
    supabase
      .from("users")
      .update({ forge_score: total })
      .eq("id", userId),

    supabase
      .from("forge_score_history")
      .insert({ user_id: userId, score: total }),
  ]);

  return total;
}
