import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { adminDb } from "@/lib/firebase/admin";

export const analyticsRouter = router({
  forgeScoreHistory: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000).toISOString();
      const snap = await adminDb
        .collection("forge_score_history")
        .where("userId", "==", ctx.user.id)
        .where("recordedAt", ">=", since)
        .orderBy("recordedAt")
        .get();

      return snap.docs.map((d) => ({
        date: (d.data().recordedAt as string).split("T")[0],
        score: d.data().score as number,
      }));
    }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().split("T")[0];
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const [userSnap, activeHabitsSnap, todayCompletionsSnap, recentCheckinsSnap] =
      await Promise.all([
        adminDb.collection("users").doc(ctx.user.id).get(),
        adminDb
          .collection("habits")
          .where("userId", "==", ctx.user.id)
          .where("isActive", "==", true)
          .get(),
        adminDb
          .collection("habit_completions")
          .where("userId", "==", ctx.user.id)
          .where("localDate", "==", today)
          .get(),
        adminDb
          .collection("daily_checkins")
          .where("userId", "==", ctx.user.id)
          .where("onboardingMirror", "==", false)
          .where("localDate", ">=", fourteenDaysAgo)
          .orderBy("localDate", "desc")
          .get(),
      ]);

    const forgeScore = userSnap.data()?.forgeScore ?? 0;
    const activeHabitIds = new Set(activeHabitsSnap.docs.map((d) => d.id));
    const completedToday = todayCompletionsSnap.docs.filter(
      (d) => activeHabitIds.has(d.data().habitId) && d.data().completed
    ).length;

    const habitStats = {
      total: activeHabitIds.size,
      completedToday,
      completionRate: activeHabitIds.size > 0
        ? Math.round((completedToday / activeHabitIds.size) * 100)
        : 0,
    };

    const checkinDates = new Set(
      recentCheckinsSnap.docs.map((d) => d.data().localDate as string)
    );
    let checkinStreak = 0;
    const cursor = new Date(today);
    for (let i = 0; i < 14; i++) {
      const d = cursor.toISOString().split("T")[0];
      if (checkinDates.has(d)) { checkinStreak++; cursor.setDate(cursor.getDate() - 1); }
      else break;
    }

    const honestyScores = recentCheckinsSnap.docs
      .map((d) => d.data().honestyScore as number | null)
      .filter((s): s is number => s !== null);
    const avgHonestyScore = honestyScores.length > 0
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

      const [activeHabitsSnap, completionsSnap] = await Promise.all([
        adminDb
          .collection("habits")
          .where("userId", "==", ctx.user.id)
          .where("isActive", "==", true)
          .get(),
        adminDb
          .collection("habit_completions")
          .where("userId", "==", ctx.user.id)
          .where("localDate", ">=", cutoff)
          .orderBy("localDate")
          .get(),
      ]);

      const totalHabits = activeHabitsSnap.size;
      if (!totalHabits) return [];

      const byDate: Record<string, { total: number; done: number }> = {};
      for (const d of completionsSnap.docs) {
        const date = d.data().localDate as string;
        if (!byDate[date]) byDate[date] = { total: totalHabits, done: 0 };
        if (d.data().completed) byDate[date].done++;
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

      const snap = await adminDb
        .collection("daily_checkins")
        .where("userId", "==", ctx.user.id)
        .where("onboardingMirror", "==", false)
        .where("localDate", ">=", cutoff)
        .orderBy("localDate")
        .get();

      return snap.docs
        .filter((d) => d.data().honestyScore != null)
        .map((d) => ({
          date: d.data().localDate as string,
          score: d.data().honestyScore as number,
        }));
    }),

  xpHistory: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000).toISOString();
      const snap = await adminDb
        .collection("xp_events")
        .where("userId", "==", ctx.user.id)
        .where("createdAt", ">=", since)
        .orderBy("createdAt")
        .get();

      const byDate: Record<string, number> = {};
      for (const d of snap.docs) {
        const date = (d.data().createdAt as string).split("T")[0];
        byDate[date] = (byDate[date] ?? 0) + (d.data().xpAmount as number);
      }

      return Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, xp]) => ({ date, xp }));
    }),

  getLatestWeeklyReport: protectedProcedure.query(async ({ ctx }) => {
    const snap = await adminDb
      .collection("weekly_reports")
      .where("userId", "==", ctx.user.id)
      .orderBy("weekStartDate", "desc")
      .limit(1)
      .get();

    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  }),

  habitCompletionByHabit: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      const cutoff = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const [activeHabitsSnap, completionsSnap] = await Promise.all([
        adminDb
          .collection("habits")
          .where("userId", "==", ctx.user.id)
          .where("isActive", "==", true)
          .get(),
        adminDb
          .collection("habit_completions")
          .where("userId", "==", ctx.user.id)
          .where("localDate", ">=", cutoff)
          .get(),
      ]);

      if (activeHabitsSnap.empty) return [];

      return activeHabitsSnap.docs.map((h) => {
        const rows = completionsSnap.docs.filter((d) => d.data().habitId === h.id);
        const done = rows.filter((d) => d.data().completed).length;
        const total = rows.length;
        const name = h.data().name as string;
        return {
          name: name.length > 12 ? name.slice(0, 12) + "…" : name,
          rate: total > 0 ? Math.round((done / total) * 100) : 0,
        };
      });
    }),

  getPeriodStats: protectedProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      const cutoff = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const [userSnap, checkinSnap, completionSnap] = await Promise.all([
        adminDb.collection("users").doc(ctx.user.id).get(),
        adminDb
          .collection("daily_checkins")
          .where("userId", "==", ctx.user.id)
          .where("onboardingMirror", "==", false)
          .where("localDate", ">=", cutoff)
          .get(),
        adminDb
          .collection("habit_completions")
          .where("userId", "==", ctx.user.id)
          .where("localDate", ">=", cutoff)
          .where("completed", "==", true)
          .get(),
      ]);

      const scores = checkinSnap.docs
        .map((d) => d.data().honestyScore as number | null)
        .filter((s): s is number => s !== null);
      const avgHonestyScore = scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;

      return {
        forgeScore: userSnap.data()?.forgeScore ?? 0,
        checkinCount: scores.length,
        avgHonestyScore,
        habitsCompleted: completionSnap.size,
      };
    }),
});
