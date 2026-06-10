import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const analyticsRouter = router({
  // -------------------------------------------------------------------------
  // Forge Score History
  // -------------------------------------------------------------------------
  forgeScoreHistory: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.supabase
        .from("forge_score_history")
        .select("score, recorded_at")
        .eq("user_id", ctx.user.id)
        .gte(
          "recorded_at",
          new Date(Date.now() - input.days * 24 * 60 * 60 * 1000).toISOString()
        )
        .order("recorded_at", { ascending: true });

      return (data ?? []).map((row: { score: number; recorded_at: string }) => ({
        date: row.recorded_at.split("T")[0],
        score: row.score,
      }));
    }),

  // -------------------------------------------------------------------------
  // Dashboard Stats
  // -------------------------------------------------------------------------
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const [
      profileResult,
      activeHabitsResult,
      todayCompletionsResult,
      recentCheckinsResult,
    ] = await Promise.all([
      ctx.supabase
        .from("users")
        .select("forge_score")
        .eq("id", ctx.user.id)
        .single(),

      ctx.supabase
        .from("habits")
        .select("id")
        .eq("user_id", ctx.user.id)
        .eq("is_active", true),

      ctx.supabase
        .from("habit_completions")
        .select("habit_id, completed")
        .eq("user_id", ctx.user.id)
        .eq("local_date", today),

      ctx.supabase
        .from("daily_checkins")
        .select("local_date, honesty_score")
        .eq("user_id", ctx.user.id)
        .eq("onboarding_mirror", false)
        .gte("local_date", fourteenDaysAgo)
        .order("local_date", { ascending: false }),
    ]);

    const forgeScore = profileResult.data?.forge_score ?? 0;

    // Habit stats
    const activeHabitIds = new Set(
      (activeHabitsResult.data ?? []).map((h: { id: string }) => h.id)
    );
    const todayCompletions = (todayCompletionsResult.data ?? []) as Array<{
      habit_id: string;
      completed: boolean;
    }>;
    const completedToday = todayCompletions.filter(
      (c) => activeHabitIds.has(c.habit_id) && c.completed
    ).length;

    const habitStats = {
      total: activeHabitIds.size,
      completedToday,
      completionRate:
        activeHabitIds.size > 0
          ? Math.round((completedToday / activeHabitIds.size) * 100)
          : 0,
    };

    // Check-in streak — consecutive days from today backwards
    const recentCheckins = (recentCheckinsResult.data ?? []) as Array<{
      local_date: string;
      honesty_score: number | null;
    }>;
    const checkinDates = new Set(recentCheckins.map((c) => c.local_date));

    let checkinStreak = 0;
    const cursor = new Date(today);
    for (let i = 0; i < 14; i++) {
      const d = cursor.toISOString().split("T")[0];
      if (checkinDates.has(d)) {
        checkinStreak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }

    // Average honesty score over last 14 days
    const honestyScores = recentCheckins
      .map((c) => c.honesty_score)
      .filter((s): s is number => s !== null);
    const avgHonestyScore =
      honestyScores.length > 0
        ? Math.round(
            honestyScores.reduce((a, b) => a + b, 0) / honestyScores.length
          )
        : 0;

    return { forgeScore, habitStats, checkinStreak, avgHonestyScore };
  }),

  // -------------------------------------------------------------------------
  // Habit Completion Rates (last N days, per-day aggregate)
  // -------------------------------------------------------------------------
  habitCompletionRates: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(7) }))
    .query(async ({ ctx, input }) => {
      const cutoff = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const [habitsResult, completionsResult] = await Promise.all([
        ctx.supabase
          .from("habits")
          .select("id")
          .eq("user_id", ctx.user.id)
          .eq("is_active", true),

        ctx.supabase
          .from("habit_completions")
          .select("local_date, completed")
          .eq("user_id", ctx.user.id)
          .gte("local_date", cutoff)
          .order("local_date", { ascending: true }),
      ]);

      const totalHabits = (habitsResult.data ?? []).length;
      if (!totalHabits) return [];

      // Group completions by date
      const byDate: Record<string, { total: number; done: number }> = {};
      for (const row of completionsResult.data ?? []) {
        const d = row.local_date as string;
        if (!byDate[d]) byDate[d] = { total: totalHabits, done: 0 };
        if (row.completed) byDate[d].done++;
      }

      return Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, { total, done }]) => ({
          date,
          rate: Math.round((done / total) * 100),
        }));
    }),

  // -------------------------------------------------------------------------
  // Check-in Honesty Trend (last N days)
  // -------------------------------------------------------------------------
  checkinHonestyTrend: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(14) }))
    .query(async ({ ctx, input }) => {
      const cutoff = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const { data } = await ctx.supabase
        .from("daily_checkins")
        .select("local_date, honesty_score")
        .eq("user_id", ctx.user.id)
        .eq("onboarding_mirror", false)
        .gte("local_date", cutoff)
        .not("honesty_score", "is", null)
        .order("local_date", { ascending: true });

      return (data ?? []).map(
        (row: { local_date: string; honesty_score: number }) => ({
          date: row.local_date,
          score: row.honesty_score,
        })
      );
    }),

  // -------------------------------------------------------------------------
  // XP History — cumulative daily XP events
  // -------------------------------------------------------------------------
  xpHistory: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.supabase
        .from("xp_events")
        .select("xp_amount, created_at")
        .eq("user_id", ctx.user.id)
        .gte(
          "created_at",
          new Date(Date.now() - input.days * 24 * 60 * 60 * 1000).toISOString()
        )
        .order("created_at", { ascending: true });

      // Aggregate by day
      const byDate: Record<string, number> = {};
      for (const row of data ?? []) {
        const d = (row.created_at as string).split("T")[0];
        byDate[d] = (byDate[d] ?? 0) + (row.xp_amount as number);
      }

      return Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, xp]) => ({ date, xp }));
    }),

  getLatestWeeklyReport: protectedProcedure.query(async ({ ctx }) => {
    const { data } = await ctx.supabase
      .from("weekly_reports")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("week_start_date", { ascending: false })
      .limit(1)
      .single();
    return data ?? null;
  }),
});
