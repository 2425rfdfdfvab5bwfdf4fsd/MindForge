import { z } from "zod";
import { eq, and, gte, desc, asc, isNotNull, count } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import {
  forgeScoreHistory,
  users,
  habits,
  habitCompletions,
  dailyCheckins,
  xpEvents,
  weeklyReports,
} from "@/shared/schema";

export const analyticsRouter = router({
  forgeScoreHistory: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({ score: forgeScoreHistory.score, recordedAt: forgeScoreHistory.recordedAt })
        .from(forgeScoreHistory)
        .where(
          and(
            eq(forgeScoreHistory.userId, ctx.user.id),
            gte(
              forgeScoreHistory.recordedAt,
              new Date(Date.now() - input.days * 24 * 60 * 60 * 1000)
            )
          )
        )
        .orderBy(asc(forgeScoreHistory.recordedAt));

      return rows.map((r) => ({
        date: (r.recordedAt as Date).toISOString().split("T")[0],
        score: r.score,
      }));
    }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const [profileRows, activeHabitRows, todayCompletionRows, recentCheckinRows] =
      await Promise.all([
        ctx.db
          .select({ forgeScore: users.forgeScore })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1),

        ctx.db
          .select({ id: habits.id })
          .from(habits)
          .where(
            and(eq(habits.userId, ctx.user.id), eq(habits.isActive, true))
          ),

        ctx.db
          .select({
            habitId: habitCompletions.habitId,
            completed: habitCompletions.completed,
          })
          .from(habitCompletions)
          .where(
            and(
              eq(habitCompletions.userId, ctx.user.id),
              eq(habitCompletions.localDate, today)
            )
          ),

        ctx.db
          .select({
            localDate: dailyCheckins.localDate,
            honestyScore: dailyCheckins.honestyScore,
          })
          .from(dailyCheckins)
          .where(
            and(
              eq(dailyCheckins.userId, ctx.user.id),
              eq(dailyCheckins.onboardingMirror, false),
              gte(dailyCheckins.localDate, fourteenDaysAgo)
            )
          )
          .orderBy(desc(dailyCheckins.localDate)),
      ]);

    const forgeScore = profileRows[0]?.forgeScore ?? 0;
    const activeHabitIds = new Set(activeHabitRows.map((h) => h.id));
    const completedToday = todayCompletionRows.filter(
      (c) => activeHabitIds.has(c.habitId) && c.completed
    ).length;

    const habitStats = {
      total: activeHabitIds.size,
      completedToday,
      completionRate:
        activeHabitIds.size > 0
          ? Math.round((completedToday / activeHabitIds.size) * 100)
          : 0,
    };

    const checkinDates = new Set(
      recentCheckinRows.map((c) => c.localDate as string)
    );
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

    const honestyScores = recentCheckinRows
      .map((c) => c.honestyScore)
      .filter((s): s is number => s !== null);
    const avgHonestyScore =
      honestyScores.length > 0
        ? Math.round(honestyScores.reduce((a, b) => a + b, 0) / honestyScores.length)
        : 0;

    return { forgeScore, habitStats, checkinStreak, avgHonestyScore };
  }),

  habitCompletionRates: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(7) }))
    .query(async ({ ctx, input }) => {
      const cutoff = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const [activeHabits, completionRows] = await Promise.all([
        ctx.db
          .select({ id: habits.id })
          .from(habits)
          .where(
            and(eq(habits.userId, ctx.user.id), eq(habits.isActive, true))
          ),

        ctx.db
          .select({
            localDate: habitCompletions.localDate,
            completed: habitCompletions.completed,
          })
          .from(habitCompletions)
          .where(
            and(
              eq(habitCompletions.userId, ctx.user.id),
              gte(habitCompletions.localDate, cutoff)
            )
          )
          .orderBy(asc(habitCompletions.localDate)),
      ]);

      const totalHabits = activeHabits.length;
      if (!totalHabits) return [];

      const byDate: Record<string, { total: number; done: number }> = {};
      for (const row of completionRows) {
        const d = row.localDate as string;
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

  checkinHonestyTrend: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(14) }))
    .query(async ({ ctx, input }) => {
      const cutoff = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const rows = await ctx.db
        .select({
          localDate: dailyCheckins.localDate,
          honestyScore: dailyCheckins.honestyScore,
        })
        .from(dailyCheckins)
        .where(
          and(
            eq(dailyCheckins.userId, ctx.user.id),
            eq(dailyCheckins.onboardingMirror, false),
            gte(dailyCheckins.localDate, cutoff),
            isNotNull(dailyCheckins.honestyScore)
          )
        )
        .orderBy(asc(dailyCheckins.localDate));

      return rows.map((r) => ({
        date: r.localDate as string,
        score: r.honestyScore!,
      }));
    }),

  xpHistory: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          xpAmount: xpEvents.xpAmount,
          createdAt: xpEvents.createdAt,
        })
        .from(xpEvents)
        .where(
          and(
            eq(xpEvents.userId, ctx.user.id),
            gte(
              xpEvents.createdAt,
              new Date(Date.now() - input.days * 24 * 60 * 60 * 1000)
            )
          )
        )
        .orderBy(asc(xpEvents.createdAt));

      const byDate: Record<string, number> = {};
      for (const row of rows) {
        const d = (row.createdAt as Date).toISOString().split("T")[0];
        byDate[d] = (byDate[d] ?? 0) + row.xpAmount;
      }

      return Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, xp]) => ({ date, xp }));
    }),

  getLatestWeeklyReport: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(weeklyReports)
      .where(eq(weeklyReports.userId, ctx.user.id))
      .orderBy(desc(weeklyReports.weekStartDate))
      .limit(1);

    return rows[0] ?? null;
  }),
});
