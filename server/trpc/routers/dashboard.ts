import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { adminDb } from "@/lib/firebase/admin";

export const dashboardRouter = router({
  getAll: protectedProcedure
    .input(z.object({ localDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // All queries use only a single where("userId") equality filter so that
      // Firestore's automatic single-field index is sufficient — no composite
      // indexes required. Secondary filtering is done in JavaScript.
      const [
        userSnap,
        habitsSnap,
        completionsSnap,
        checkinSnap,
        challengesSnap,
        cookieJarSnap,
        xpEventsSnap,
      ] = await Promise.all([
        adminDb.collection("users").doc(userId).get(),
        adminDb
          .collection("habits")
          .where("userId", "==", userId)
          .get(),
        adminDb
          .collection("habit_completions")
          .where("userId", "==", userId)
          .limit(500)
          .get(),
        adminDb
          .collection("daily_checkins")
          .where("userId", "==", userId)
          .limit(60)
          .get(),
        adminDb
          .collection("user_challenges")
          .where("userId", "==", userId)
          .limit(20)
          .get(),
        adminDb
          .collection("cookie_jar_entries")
          .where("userId", "==", userId)
          .limit(100)
          .get(),
        adminDb
          .collection("xp_events")
          .where("userId", "==", userId)
          .limit(500)
          .get(),
      ]);

      const user = userSnap.data() ?? null;

      // Filter active habits and sort by sortOrder in JS
      const activeHabitDocs = habitsSnap.docs.filter(
        (d) => d.data().isActive === true
      );
      const habitIds = activeHabitDocs.map((d) => d.id);

      const streakResults = habitIds.length
        ? await Promise.all(
            habitIds.map((id) =>
              adminDb.collection("habit_streaks").doc(id).get()
            )
          )
        : [];

      const streakMap = new Map<
        string,
        { currentStreak: number; longestStreak: number }
      >();
      streakResults.forEach((s) => {
        if (s.exists) {
          streakMap.set(s.id, {
            currentStreak: s.data()?.currentStreak ?? 0,
            longestStreak: s.data()?.longestStreak ?? 0,
          });
        }
      });

      // Filter completions for today in JS
      const completionMap = new Map<string, boolean>();
      completionsSnap.docs.forEach((d) => {
        if (d.data().localDate === input.localDate) {
          completionMap.set(d.data().habitId, d.data().completed);
        }
      });

      const todayDow = new Date(input.localDate + "T12:00:00").getDay();
      const todayHabits = activeHabitDocs
        .filter((d) => {
          const days = d.data().targetDays as number[];
          return !days || days.includes(todayDow);
        })
        .map((d) => {
          const h = d.data();
          const completedVal = completionMap.get(d.id);
          const today_status =
            completedVal === undefined
              ? "pending"
              : completedVal
              ? "completed"
              : "missed";
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

      const topStreaks = activeHabitDocs
        .map((d) => ({
          name: d.data().name as string,
          current_streak: streakMap.get(d.id)?.currentStreak ?? 0,
        }))
        .sort((a, b) => b.current_streak - a.current_streak)
        .slice(0, 3);

      // Filter today's check-in in JS (non-onboarding only)
      const todayCheckinDoc = checkinSnap.docs.find(
        (d) =>
          d.data().localDate === input.localDate &&
          d.data().onboardingMirror === false
      );
      const todayCheckin = todayCheckinDoc
        ? {
            id: todayCheckinDoc.id,
            mood_signal: todayCheckinDoc.data().moodSignal,
            honesty_score: todayCheckinDoc.data().honestyScore,
            created_at: todayCheckinDoc.data().createdAt,
          }
        : null;

      // Find active challenge in JS
      const activeChalDoc = challengesSnap.docs.find(
        (d) => d.data().status === "active"
      );
      let activeChallenge = null;
      if (activeChalDoc) {
        const uc = activeChalDoc.data();
        const chalSnap = await adminDb
          .collection("challenges")
          .doc(uc.challengeId)
          .get();
        const chal = chalSnap.data();
        activeChallenge = {
          id: activeChalDoc.id,
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

      // Sort cookie jar entries by createdAt desc in JS, take top 3
      const recentCookieJar = cookieJarSnap.docs
        .sort((a, b) => {
          const aTime = a.data().createdAt ?? "";
          const bTime = b.data().createdAt ?? "";
          return bTime > aTime ? 1 : bTime < aTime ? -1 : 0;
        })
        .slice(0, 3)
        .map((d) => ({
          id: d.id,
          title: d.data().title,
          date_of_victory: d.data().dateOfVictory,
        }));

      // Filter today's XP events in JS using the user's local timezone so that
      // events at e.g. 23:00 UTC+8 (= 15:00 UTC) are correctly included.
      const userTimezone = user?.timezone ?? "UTC";
      const todayXPDelta = xpEventsSnap.docs
        .filter((d) => {
          const t = d.data().createdAt ?? "";
          if (!t) return false;
          try {
            const eventLocalDate = new Date(t).toLocaleDateString("en-CA", {
              timeZone: userTimezone,
            });
            return eventLocalDate === input.localDate;
          } catch {
            return false;
          }
        })
        .reduce((sum, d) => sum + (d.data().xpAmount as number), 0);

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
        recentCookieJar,
        todayXPDelta,
      };
    }),
});
