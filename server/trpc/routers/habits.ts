import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { recalculateStreak, recalculateForgeScore } from "@/lib/streak";

const FREE_TIER_LIMIT = 3;

export const habitsRouter = router({
  list: protectedProcedure
    .input(z.object({ localDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data: habits } = await ctx.supabase
        .from("habits")
        .select("*")
        .eq("user_id", ctx.user.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!habits || habits.length === 0) return [];

      const habitIds = habits.map((h: { id: string }) => h.id);

      const [{ data: completions }, { data: streaks }] = await Promise.all([
        ctx.supabase
          .from("habit_completions")
          .select("habit_id, completed")
          .in("habit_id", habitIds)
          .eq("local_date", input.localDate),
        ctx.supabase
          .from("habit_streaks")
          .select("habit_id, current_streak, longest_streak")
          .in("habit_id", habitIds),
      ]);

      const completionMap = new Map(
        (completions ?? []).map(
          (c: { habit_id: string; completed: boolean }) => [c.habit_id, c.completed]
        )
      );
      const streakMap = new Map(
        (streaks ?? []).map(
          (s: { habit_id: string; current_streak: number; longest_streak: number }) => [
            s.habit_id,
            s,
          ]
        )
      );

      return habits.map(
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
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(60),
        category: z.enum(["health", "mind", "avoid", "perform"]),
        habitType: z.enum(["build", "avoid"]),
        targetFrequency: z.enum(["daily", "weekdays", "custom"]).default("daily"),
        targetDays: z.array(z.number().min(0).max(6)).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Free tier limit
      const { count } = await ctx.supabase
        .from("habits")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ctx.user.id)
        .eq("is_active", true);

      if ((count ?? 0) >= FREE_TIER_LIMIT) {
        const { data: profile } = await ctx.supabase
          .from("users")
          .select("tier")
          .eq("id", ctx.user.id)
          .single();

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

      const { data: habit, error } = await ctx.supabase
        .from("habits")
        .insert({
          user_id: ctx.user.id,
          name: input.name,
          category: input.category,
          habit_type: input.habitType,
          target_frequency: input.targetFrequency,
          target_days: targetDays,
        })
        .select()
        .single();

      if (error) throw error;

      await ctx.supabase.from("habit_streaks").insert({
        habit_id: habit.id,
        user_id: ctx.user.id,
        current_streak: 0,
        longest_streak: 0,
      });

      return habit;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().max(60).optional(),
        category: z.enum(["health", "mind", "avoid", "perform"]).optional(),
        targetFrequency: z.enum(["daily", "weekdays", "custom"]).optional(),
        targetDays: z.array(z.number().min(0).max(6)).optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabase
        .from("habits")
        .select("user_id")
        .eq("id", input.id)
        .single();

      if (!existing || existing.user_id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { data, error } = await ctx.supabase
        .from("habits")
        .update({
          name: input.name,
          category: input.category,
          target_frequency: input.targetFrequency,
          target_days: input.targetDays,
          sort_order: input.sortOrder,
        })
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabase
        .from("habits")
        .select("user_id")
        .eq("id", input.id)
        .single();

      if (!existing || existing.user_id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { data, error } = await ctx.supabase
        .from("habits")
        .update({ is_active: false })
        .eq("id", input.id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      // Verify ownership
      const { data: habit } = await ctx.supabase
        .from("habits")
        .select("user_id")
        .eq("id", input.habitId)
        .single();

      if (!habit || habit.user_id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Fetch previous streak before we overwrite
      const { data: prevStreak } = await ctx.supabase
        .from("habit_streaks")
        .select("current_streak")
        .eq("habit_id", input.habitId)
        .single();

      const prevStreakVal = prevStreak?.current_streak ?? 0;

      // Upsert completion
      await ctx.supabase.from("habit_completions").upsert(
        {
          habit_id: input.habitId,
          user_id: ctx.user.id,
          local_date: input.localDate,
          completed: input.completed,
          notes: input.notes,
          completion_time: new Date().toISOString(),
        },
        { onConflict: "habit_id,local_date" }
      );

      // Recalculate streak
      const newStreak = await recalculateStreak(
        ctx.supabase,
        input.habitId,
        ctx.user.id,
        input.localDate
      );

      let xpAwarded = 0;
      let leveledUp = false;

      if (input.completed) {
        const XP = 20;
        xpAwarded = XP;

        await ctx.supabase.from("xp_events").insert({
          user_id: ctx.user.id,
          xp_amount: XP,
          reason: "Habit completed",
          event_type: "habit_complete",
        });

        const { data: user } = await ctx.supabase
          .from("users")
          .select("xp, level")
          .eq("id", ctx.user.id)
          .single();

        if (user) {
          const newXP = (user.xp ?? 0) + XP;
          const newLevel = Math.floor(newXP / 1000) + 1;
          leveledUp = newLevel > (user.level ?? 1);
          await ctx.supabase
            .from("users")
            .update({ xp: newXP, level: newLevel })
            .eq("id", ctx.user.id);
        }
      }

      await recalculateForgeScore(ctx.supabase, ctx.user.id);

      const { data: updatedUser } = await ctx.supabase
        .from("users")
        .select("forge_score")
        .eq("id", ctx.user.id)
        .single();

      const triggerFortyPercent =
        !input.completed && prevStreakVal >= 7;

      return {
        streak: newStreak,
        forgeScore: updatedUser?.forge_score ?? 0,
        xpAwarded,
        leveledUp,
        triggerFortyPercent,
      };
    }),

  getCompletionHistory: protectedProcedure
    .input(z.object({ habitId: z.string().uuid(), days: z.number().min(1).max(365) }))
    .query(async ({ ctx, input }) => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - input.days);

      const { data } = await ctx.supabase
        .from("habit_completions")
        .select("local_date, completed")
        .eq("habit_id", input.habitId)
        .eq("user_id", ctx.user.id)
        .gte("local_date", from.toISOString().slice(0, 10))
        .lte("local_date", to.toISOString().slice(0, 10))
        .order("local_date", { ascending: true });

      return data ?? [];
    }),
});
