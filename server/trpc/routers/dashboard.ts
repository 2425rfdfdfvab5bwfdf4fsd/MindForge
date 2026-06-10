import { z } from "zod";
import { eq, and, gte, lte, inArray, desc, asc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import {
  users,
  habits,
  habitStreaks,
  habitCompletions,
  dailyCheckins,
  userChallenges,
  challenges,
  cookieJarEntries,
  xpEvents,
} from "@/shared/schema";

export const dashboardRouter = router({
  getAll: protectedProcedure
    .input(z.object({ localDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const [
        userRows,
        habitsList,
        streaksList,
        completionsList,
        checkinRows,
        challengeRows,
        cookieJarRows,
        todayXPRows,
      ] = await Promise.all([
        ctx.db
          .select({
            forgeScore: users.forgeScore,
            xp: users.xp,
            level: users.level,
            timezone: users.timezone,
            displayName: users.displayName,
            currentStreakDays: users.currentStreakDays,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1),

        ctx.db
          .select({
            id: habits.id,
            name: habits.name,
            category: habits.category,
            habitType: habits.habitType,
            targetFrequency: habits.targetFrequency,
            targetDays: habits.targetDays,
            sortOrder: habits.sortOrder,
          })
          .from(habits)
          .where(and(eq(habits.userId, userId), eq(habits.isActive, true)))
          .orderBy(asc(habits.sortOrder)),

        ctx.db
          .select({
            habitId: habitStreaks.habitId,
            currentStreak: habitStreaks.currentStreak,
            longestStreak: habitStreaks.longestStreak,
          })
          .from(habitStreaks)
          .where(eq(habitStreaks.userId, userId)),

        ctx.db
          .select({
            habitId: habitCompletions.habitId,
            completed: habitCompletions.completed,
          })
          .from(habitCompletions)
          .where(
            and(
              eq(habitCompletions.userId, userId),
              eq(habitCompletions.localDate, input.localDate)
            )
          ),

        ctx.db
          .select({
            id: dailyCheckins.id,
            moodSignal: dailyCheckins.moodSignal,
            honestyScore: dailyCheckins.honestyScore,
            createdAt: dailyCheckins.createdAt,
          })
          .from(dailyCheckins)
          .where(
            and(
              eq(dailyCheckins.userId, userId),
              eq(dailyCheckins.localDate, input.localDate),
              eq(dailyCheckins.onboardingMirror, false)
            )
          )
          .limit(1),

        ctx.db
          .select({
            id: userChallenges.id,
            startedAt: userChallenges.startedAt,
            status: userChallenges.status,
            challengeTitle: challenges.title,
            challengeDescription: challenges.description,
            challengeDurationMinutes: challenges.durationMinutes,
            challengeId: challenges.id,
          })
          .from(userChallenges)
          .leftJoin(challenges, eq(challenges.id, userChallenges.challengeId))
          .where(
            and(
              eq(userChallenges.userId, userId),
              eq(userChallenges.status, "active")
            )
          )
          .limit(1),

        ctx.db
          .select({
            id: cookieJarEntries.id,
            title: cookieJarEntries.title,
            dateOfVictory: cookieJarEntries.dateOfVictory,
          })
          .from(cookieJarEntries)
          .where(eq(cookieJarEntries.userId, userId))
          .orderBy(desc(cookieJarEntries.createdAt))
          .limit(3),

        ctx.db
          .select({ xpAmount: xpEvents.xpAmount })
          .from(xpEvents)
          .where(
            and(
              eq(xpEvents.userId, userId),
              gte(xpEvents.createdAt, new Date(input.localDate + "T00:00:00")),
              lte(xpEvents.createdAt, new Date(input.localDate + "T23:59:59"))
            )
          ),
      ]);

      const user = userRows[0] ?? null;

      const streakMap = new Map(streaksList.map((s) => [s.habitId, s]));
      const completionMap = new Map(
        completionsList.map((c) => [c.habitId, c.completed])
      );

      const todayDow = new Date(input.localDate + "T12:00:00").getDay();
      const todayHabits = habitsList
        .filter((h) => {
          const days = h.targetDays as number[];
          return !days || days.includes(todayDow);
        })
        .map((h) => {
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
            habit_type: h.habitType,
            target_frequency: h.targetFrequency,
            target_days: h.targetDays as number[],
            sort_order: h.sortOrder,
            current_streak: streak?.currentStreak ?? 0,
            longest_streak: streak?.longestStreak ?? 0,
            today_status,
          };
        });

      const topStreaks = habitsList
        .map((h) => ({
          name: h.name,
          current_streak: streakMap.get(h.id)?.currentStreak ?? 0,
        }))
        .sort((a, b) => b.current_streak - a.current_streak)
        .slice(0, 3);

      const todayXPDelta = todayXPRows.reduce(
        (sum, e) => sum + e.xpAmount,
        0
      );

      const rawChallenge = challengeRows[0] ?? null;
      const activeChallenge = rawChallenge
        ? {
            id: rawChallenge.id,
            started_at: rawChallenge.startedAt,
            status: rawChallenge.status,
            challenges: rawChallenge.challengeId
              ? {
                  id: rawChallenge.challengeId,
                  title: rawChallenge.challengeTitle,
                  description: rawChallenge.challengeDescription,
                  duration_minutes: rawChallenge.challengeDurationMinutes,
                }
              : null,
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
        todayCheckin: checkinRows[0]
          ? {
              id: checkinRows[0].id,
              mood_signal: checkinRows[0].moodSignal,
              honesty_score: checkinRows[0].honestyScore,
              created_at: checkinRows[0].createdAt,
            }
          : null,
        activeChallenge,
        forgeScore: user?.forgeScore ?? 0,
        xp: user?.xp ?? 0,
        level: user?.level ?? 1,
        topStreaks,
        recentCookieJar: cookieJarRows.map((e) => ({
          id: e.id,
          title: e.title,
          date_of_victory: e.dateOfVictory,
        })),
        todayXPDelta,
      };
    }),
});
