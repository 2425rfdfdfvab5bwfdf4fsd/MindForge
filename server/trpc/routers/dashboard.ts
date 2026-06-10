import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const dashboardRouter = router({
  getAll: protectedProcedure
    .input(z.object({ localDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const [
        userResult,
        habitsResult,
        streaksResult,
        completionsResult,
        checkinResult,
        challengeResult,
        cookieJarResult,
      ] = await Promise.all([
        // User profile: forge_score, xp, level, timezone, display_name
        ctx.supabase
          .from("users")
          .select("forge_score, xp, level, timezone, display_name, current_streak_days")
          .eq("id", userId)
          .single(),

        // Active habits
        ctx.supabase
          .from("habits")
          .select("id, name, category, habit_type, target_frequency, target_days, sort_order")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),

        // Streaks for all habits
        ctx.supabase
          .from("habit_streaks")
          .select("habit_id, current_streak, longest_streak")
          .eq("user_id", userId),

        // Today's completions
        ctx.supabase
          .from("habit_completions")
          .select("habit_id, completed")
          .eq("user_id", userId)
          .eq("local_date", input.localDate),

        // Today's check-in (exclude onboarding mirrors)
        ctx.supabase
          .from("daily_checkins")
          .select("id, mood_signal, honesty_score, created_at")
          .eq("user_id", userId)
          .eq("local_date", input.localDate)
          .eq("onboarding_mirror", false)
          .maybeSingle(),

        // Active user challenge joined with challenge details
        ctx.supabase
          .from("user_challenges")
          .select("id, started_at, status, challenges(id, title, description, duration_days)")
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle(),

        // Recent cookie jar (last 3)
        ctx.supabase
          .from("cookie_jar_entries")
          .select("id, title, date_of_victory")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      const user = userResult.data;
      const habits = habitsResult.data ?? [];
      const streaks = streaksResult.data ?? [];
      const completions = completionsResult.data ?? [];

      // Build maps
      const streakMap = new Map(
        streaks.map((s: { habit_id: string; current_streak: number; longest_streak: number }) => [
          s.habit_id,
          s,
        ])
      );
      const completionMap = new Map(
        completions.map(
          (c: { habit_id: string; completed: boolean }) => [c.habit_id, c.completed]
        )
      );

      // Filter to today's day-of-week
      const todayDow = new Date(input.localDate + "T12:00:00").getDay(); // 0=Sun
      const todayHabits = habits
        .filter(
          (h: { target_days: number[] }) =>
            !h.target_days || h.target_days.includes(todayDow)
        )
        .map(
          (h: {
            id: string;
            name: string;
            category: string;
            habit_type: string;
            target_frequency: string;
            target_days: number[];
            sort_order: number;
          }) => {
            const completedVal = completionMap.get(h.id);
            const today_status =
              completedVal === undefined
                ? "pending"
                : completedVal
                ? "completed"
                : "missed";
            const streak = streakMap.get(h.id);
            return {
              id: h.id,
              name: h.name,
              category: h.category,
              habit_type: h.habit_type,
              target_frequency: h.target_frequency,
              target_days: h.target_days,
              sort_order: h.sort_order,
              current_streak: streak?.current_streak ?? 0,
              longest_streak: streak?.longest_streak ?? 0,
              today_status,
            };
          }
        );

      // Top streaks (top 3 by current_streak)
      const topStreaks = habits
        .map((h: { id: string; name: string }) => ({
          name: h.name,
          current_streak: streakMap.get(h.id)?.current_streak ?? 0,
        }))
        .sort(
          (a: { current_streak: number }, b: { current_streak: number }) =>
            b.current_streak - a.current_streak
        )
        .slice(0, 3);

      // Today's forge score delta (XP earned today)
      // Simple: sum xp_events for today
      const { data: todayXPEvents } = await ctx.supabase
        .from("xp_events")
        .select("xp_amount")
        .eq("user_id", userId)
        .gte("created_at", input.localDate + "T00:00:00")
        .lte("created_at", input.localDate + "T23:59:59");

      const todayXPDelta = (todayXPEvents ?? []).reduce(
        (sum: number, e: { xp_amount: number }) => sum + e.xp_amount,
        0
      );

      return {
        user: user ?? null,
        habits: todayHabits,
        todayCheckin: checkinResult.data ?? null,
        activeChallenge: challengeResult.data ?? null,
        forgeScore: user?.forge_score ?? 0,
        xp: user?.xp ?? 0,
        level: user?.level ?? 1,
        topStreaks,
        recentCookieJar: cookieJarResult.data ?? [],
        todayXPDelta,
      };
    }),
});
