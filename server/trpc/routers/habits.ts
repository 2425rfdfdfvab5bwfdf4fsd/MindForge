import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, gte, lte, inArray, count, desc, asc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import {
  habits,
  habitCompletions,
  habitStreaks,
  users,
} from "@/shared/schema";
import { recalculateStreak, recalculateForgeScore } from "@/lib/streak";
import { awardXP } from "@/lib/xp";

const FREE_TIER_LIMIT = 3;

export const habitsRouter = router({
  list: protectedProcedure
    .input(z.object({ localDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const habitsList = await ctx.db
        .select()
        .from(habits)
        .where(and(eq(habits.userId, ctx.user.id), eq(habits.isActive, true)))
        .orderBy(asc(habits.sortOrder));

      if (!habitsList.length) return [];

      const habitIds = habitsList.map((h) => h.id);

      const [completions, streaks] = await Promise.all([
        ctx.db
          .select({
            habitId: habitCompletions.habitId,
            completed: habitCompletions.completed,
          })
          .from(habitCompletions)
          .where(
            and(
              inArray(habitCompletions.habitId, habitIds),
              eq(habitCompletions.localDate, input.localDate)
            )
          ),
        ctx.db
          .select({
            habitId: habitStreaks.habitId,
            currentStreak: habitStreaks.currentStreak,
            longestStreak: habitStreaks.longestStreak,
          })
          .from(habitStreaks)
          .where(inArray(habitStreaks.habitId, habitIds)),
      ]);

      const completionMap = new Map(
        completions.map((c) => [c.habitId, c.completed])
      );
      const streakMap = new Map(streaks.map((s) => [s.habitId, s]));

      return habitsList.map((h) => {
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
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(60),
        category: z.enum(["health", "mind", "avoid", "perform"]),
        habitType: z.enum(["build", "avoid"]),
        targetFrequency: z
          .enum(["daily", "weekdays", "custom"])
          .default("daily"),
        targetDays: z.array(z.number().min(0).max(6)).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [{ value: habitCount }] = await ctx.db
        .select({ value: count() })
        .from(habits)
        .where(and(eq(habits.userId, ctx.user.id), eq(habits.isActive, true)));

      if (habitCount >= FREE_TIER_LIMIT) {
        const [profile] = await ctx.db
          .select({ tier: users.tier })
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        if (!profile || profile.tier === "free") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: JSON.stringify({ upgradeRequired: true }),
          });
        }
      }

      const targetDays =
        input.targetFrequency === "weekdays"
          ? [1, 2, 3, 4, 5]
          : input.targetFrequency === "custom" && input.targetDays
          ? input.targetDays
          : [0, 1, 2, 3, 4, 5, 6];

      const [habit] = await ctx.db
        .insert(habits)
        .values({
          userId: ctx.user.id,
          name: input.name,
          category: input.category,
          habitType: input.habitType,
          targetFrequency: input.targetFrequency,
          targetDays,
        })
        .returning();

      await ctx.db.insert(habitStreaks).values({
        habitId: habit.id,
        userId: ctx.user.id,
        currentStreak: 0,
        longestStreak: 0,
      });

      return habit;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().max(60).optional(),
        category: z
          .enum(["health", "mind", "avoid", "perform"])
          .optional(),
        targetFrequency: z
          .enum(["daily", "weekdays", "custom"])
          .optional(),
        targetDays: z.array(z.number().min(0).max(6)).optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ userId: habits.userId })
        .from(habits)
        .where(eq(habits.id, input.id))
        .limit(1);

      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [updated] = await ctx.db
        .update(habits)
        .set({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.category !== undefined ? { category: input.category } : {}),
          ...(input.targetFrequency !== undefined
            ? { targetFrequency: input.targetFrequency }
            : {}),
          ...(input.targetDays !== undefined
            ? { targetDays: input.targetDays }
            : {}),
          ...(input.sortOrder !== undefined
            ? { sortOrder: input.sortOrder }
            : {}),
        })
        .where(eq(habits.id, input.id))
        .returning();

      return updated;
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ userId: habits.userId })
        .from(habits)
        .where(eq(habits.id, input.id))
        .limit(1);

      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [updated] = await ctx.db
        .update(habits)
        .set({ isActive: false })
        .where(eq(habits.id, input.id))
        .returning();

      return updated;
    }),

  logCompletion: protectedProcedure
    .input(
      z.object({
        habitId: z.string().uuid(),
        localDate: z.string(),
        completed: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [habit] = await ctx.db
        .select({ userId: habits.userId })
        .from(habits)
        .where(eq(habits.id, input.habitId))
        .limit(1);

      if (!habit || habit.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [prevStreak] = await ctx.db
        .select({ currentStreak: habitStreaks.currentStreak })
        .from(habitStreaks)
        .where(eq(habitStreaks.habitId, input.habitId))
        .limit(1);

      const prevStreakVal = prevStreak?.currentStreak ?? 0;

      await ctx.db
        .insert(habitCompletions)
        .values({
          habitId: input.habitId,
          userId: ctx.user.id,
          localDate: input.localDate,
          completed: input.completed,
          notes: input.notes,
          completionTime: new Date(),
        })
        .onConflictDoUpdate({
          target: [habitCompletions.habitId, habitCompletions.localDate],
          set: {
            completed: input.completed,
            notes: input.notes,
            completionTime: new Date(),
          },
        });

      const newStreak = await recalculateStreak(
        input.habitId,
        ctx.user.id,
        input.localDate
      );

      let xpAwarded = 0;
      let leveledUp = false;

      if (input.completed) {
        const result = await awardXP(
          ctx.user.id,
          20,
          "Habit completed",
          "habit_complete"
        );
        xpAwarded = result.xpAwarded;
        leveledUp = result.leveledUp;
      }

      await recalculateForgeScore(ctx.user.id);

      const [updatedUser] = await ctx.db
        .select({ forgeScore: users.forgeScore })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const triggerFortyPercent = !input.completed && prevStreakVal >= 7;

      return {
        streak: newStreak,
        forgeScore: updatedUser?.forgeScore ?? 0,
        xpAwarded,
        leveledUp,
        triggerFortyPercent,
      };
    }),

  getCompletionHistory: protectedProcedure
    .input(
      z.object({ habitId: z.string().uuid(), days: z.number().min(1).max(365) })
    )
    .query(async ({ ctx, input }) => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - input.days);

      const rows = await ctx.db
        .select({
          localDate: habitCompletions.localDate,
          completed: habitCompletions.completed,
        })
        .from(habitCompletions)
        .where(
          and(
            eq(habitCompletions.habitId, input.habitId),
            eq(habitCompletions.userId, ctx.user.id),
            gte(habitCompletions.localDate, from.toISOString().slice(0, 10)),
            lte(habitCompletions.localDate, to.toISOString().slice(0, 10))
          )
        )
        .orderBy(asc(habitCompletions.localDate));

      return rows;
    }),
});
