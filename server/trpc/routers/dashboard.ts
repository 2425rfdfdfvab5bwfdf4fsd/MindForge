import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { adminDb } from "@/lib/firebase/admin";

export const dashboardRouter = router({
  getAll: protectedProcedure
    .input(z.object({ localDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const [
        userSnap,
        habitsSnap,
        completionsSnap,
        checkinSnap,
        activeChalSnap,
        cookieJarSnap,
        todayXPSnap,
      ] = await Promise.all([
        adminDb.collection("users").doc(userId).get(),
        adminDb
          .collection("habits")
          .where("userId", "==", userId)
          .where("isActive", "==", true)
          .get(),
        adminDb
          .collection("habit_completions")
          .where("userId", "==", userId)
          .where("localDate", "==", input.localDate)
          .get(),
        adminDb
          .collection("daily_checkins")
          .where("userId", "==", userId)
          .where("localDate", "==", input.localDate)
          .where("onboardingMirror", "==", false)
          .limit(1)
          .get(),
        adminDb
          .collection("user_challenges")
          .where("userId", "==", userId)
          .where("status", "==", "active")
          .limit(1)
          .get(),
        adminDb
          .collection("cookie_jar_entries")
          .where("userId", "==", userId)
          .orderBy("createdAt", "desc")
          .limit(3)
          .get(),
        adminDb
          .collection("xp_events")
          .where("userId", "==", userId)
          .where("createdAt", ">=", input.localDate + "T00:00:00.000Z")
          .where("createdAt", "<=", input.localDate + "T23:59:59.999Z")
          .get(),
      ]);

      const user = userSnap.data() ?? null;
      const habitIds = habitsSnap.docs.map((d) => d.id);

      const streakResults = habitIds.length
        ? await Promise.all(habitIds.map((id) => adminDb.collection("habit_streaks").doc(id).get()))
        : [];

      const streakMap = new Map<string, { currentStreak: number; longestStreak: number }>();
      streakResults.forEach((s) => {
        if (s.exists) {
          streakMap.set(s.id, {
            currentStreak: s.data()?.currentStreak ?? 0,
            longestStreak: s.data()?.longestStreak ?? 0,
          });
        }
      });

      const completionMap = new Map<string, boolean>();
      completionsSnap.docs.forEach((d) => {
        completionMap.set(d.data().habitId, d.data().completed);
      });

      const todayDow = new Date(input.localDate + "T12:00:00").getDay();
      const todayHabits = habitsSnap.docs
        .filter((d) => {
          const days = d.data().targetDays as number[];
          return !days || days.includes(todayDow);
        })
        .map((d) => {
          const h = d.data();
          const completedVal = completionMap.get(d.id);
          const today_status =
            completedVal === undefined ? "pending" : completedVal ? "completed" : "missed";
          const streak = streakMap.get(d.id);
          return {
            id: d.id,
            name: h.name,
            category: h.category,
            habit_type: h.habitType,
            target_frequency: h.targetFrequency,
            target_days: h.targetDays as number[],
            sort_order: (h.sortOrder as number) ?? 0,
            current_streak: streak?.currentStreak ?? 0,
            longest_streak: streak?.longestStreak ?? 0,
            today_status,
          };
        })
        .sort((a, b) => a.sort_order - b.sort_order);

      const topStreaks = habitsSnap.docs
        .map((d) => ({
          name: d.data().name as string,
          current_streak: streakMap.get(d.id)?.currentStreak ?? 0,
        }))
        .sort((a, b) => b.current_streak - a.current_streak)
        .slice(0, 3);

      const todayXPDelta = todayXPSnap.docs.reduce(
        (sum, d) => sum + (d.data().xpAmount as number),
        0
      );

      let activeChallenge = null;
      if (!activeChalSnap.empty) {
        const uc = activeChalSnap.docs[0].data();
        const chalSnap = await adminDb.collection("challenges").doc(uc.challengeId).get();
        const chal = chalSnap.data();
        activeChallenge = {
          id: activeChalSnap.docs[0].id,
          started_at: uc.startedAt,
          status: uc.status,
          challenges: chal
            ? {
                id: chalSnap.id,
                title: chal.title,
                description: chal.description,
                duration_minutes: chal.durationMinutes,
              }
            : null,
        };
      }

      const checkinDoc = checkinSnap.empty ? null : checkinSnap.docs[0];
      const todayCheckin = checkinDoc
        ? {
            id: checkinDoc.id,
            mood_signal: checkinDoc.data().moodSignal,
            honesty_score: checkinDoc.data().honestyScore,
            created_at: checkinDoc.data().createdAt,
          }
        : null;

      return {
        user: user
          ? {
              forge_score: user.forgeScore,
              xp: user.xp,
              level: user.level,
              timezone: user.timezone,
              display_name: user.displayName,
              current_streak_days: user.currentStreakDays,
            }
          : null,
        habits: todayHabits,
        todayCheckin,
        activeChallenge,
        forgeScore: user?.forgeScore ?? 0,
        xp: user?.xp ?? 0,
        level: user?.level ?? 1,
        topStreaks,
        recentCookieJar: cookieJarSnap.docs.map((d) => ({
          id: d.id,
          title: d.data().title,
          date_of_victory: d.data().dateOfVictory,
        })),
        todayXPDelta,
      };
    }),
});
