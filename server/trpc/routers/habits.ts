import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { adminDb } from "@/lib/firebase/admin";
import { recalculateStreak, recalculateForgeScore } from "@/lib/gamification/streak";
import { awardXP, XP_AMOUNTS } from "@/lib/gamification/xp";
import { trackServerEvent } from "@/lib/posthog/server";

const FREE_TIER_LIMIT = 3;

export const habitsRouter = router({
  list: protectedProcedure
    .input(z.object({ localDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const habitsSnap = await adminDb
        .collection("habits")
        .where("userId", "==", ctx.user.id)
        .where("isActive", "==", true)
        .orderBy("sortOrder")
        .get();

      if (habitsSnap.empty) return [];

      const habitIds = habitsSnap.docs.map((d) => d.id);

      const [completionsSnap, streaksResults] = await Promise.all([
        adminDb
          .collection("habit_completions")
          .where("userId", "==", ctx.user.id)
          .where("localDate", "==", input.localDate)
          .get(),
        Promise.all(
          habitIds.map((id) =>
            adminDb.collection("habit_streaks").doc(id).get()
          )
        ),
      ]);

      const completionMap = new Map<string, boolean>();
      completionsSnap.docs.forEach((d) => {
        const data = d.data();
        if (habitIds.includes(data.habitId)) {
          completionMap.set(data.habitId, data.completed);
        }
      });

      const streakMap = new Map<string, { currentStreak: number; longestStreak: number }>();
      streaksResults.forEach((s) => {
        if (s.exists) {
          streakMap.set(s.id, {
            currentStreak: s.data()?.currentStreak ?? 0,
            longestStreak: s.data()?.longestStreak ?? 0,
          });
        }
      });

      return habitsSnap.docs
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
      const existingSnap = await adminDb
        .collection("habits")
        .where("userId", "==", ctx.user.id)
        .where("isActive", "==", true)
        .get();

      if (existingSnap.size >= FREE_TIER_LIMIT) {
        const userSnap = await adminDb.collection("users").doc(ctx.user.id).get();
        const tier = userSnap.data()?.tier ?? "free";
        if (tier === "free") {
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

      const ref = await adminDb.collection("habits").add({
        userId: ctx.user.id,
        name: input.name,
        category: input.category,
        habitType: input.habitType,
        targetFrequency: input.targetFrequency,
        targetDays,
        sortOrder: existingSnap.size,
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      await adminDb.collection("habit_streaks").doc(ref.id).set({
        habitId: ref.id,
        userId: ctx.user.id,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        updatedAt: new Date().toISOString(),
      });

      trackServerEvent(ctx.user.id, "habit_created", {
        category: input.category,
        habit_type: input.habitType,
      });

      const snap = await ref.get();
      return { id: ref.id, ...snap.data() };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().max(60).optional(),
        category: z.enum(["health", "mind", "avoid", "perform"]).optional(),
        targetFrequency: z.enum(["daily", "weekdays", "custom"]).optional(),
        targetDays: z.array(z.number().min(0).max(6)).optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ref = adminDb.collection("habits").doc(input.id);
      const snap = await ref.get();

      if (!snap.exists || snap.data()?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const update: Record<string, unknown> = {};
      if (input.name !== undefined) update.name = input.name;
      if (input.category !== undefined) update.category = input.category;
      if (input.targetFrequency !== undefined) update.targetFrequency = input.targetFrequency;
      if (input.targetDays !== undefined) update.targetDays = input.targetDays;
      if (input.sortOrder !== undefined) update.sortOrder = input.sortOrder;

      await ref.update(update);
      const updated = await ref.get();
      return { id: ref.id, ...updated.data() };
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ref = adminDb.collection("habits").doc(input.id);
      const snap = await ref.get();

      if (!snap.exists || snap.data()?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ref.update({ isActive: false });
      const updated = await ref.get();
      return { id: ref.id, ...updated.data() };
    }),

  logCompletion: protectedProcedure
    .input(
      z.object({
        habitId: z.string(),
        localDate: z.string(),
        completed: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const habitSnap = await adminDb.collection("habits").doc(input.habitId).get();
      if (!habitSnap.exists || habitSnap.data()?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const streakSnap = await adminDb.collection("habit_streaks").doc(input.habitId).get();
      const prevStreakVal = streakSnap.data()?.currentStreak ?? 0;

      const existingSnap = await adminDb
        .collection("habit_completions")
        .where("habitId", "==", input.habitId)
        .where("localDate", "==", input.localDate)
        .limit(1)
        .get();

      if (!existingSnap.empty) {
        await existingSnap.docs[0].ref.update({
          completed: input.completed,
          notes: input.notes ?? null,
          completionTime: new Date().toISOString(),
        });
      } else {
        await adminDb.collection("habit_completions").add({
          habitId: input.habitId,
          userId: ctx.user.id,
          localDate: input.localDate,
          completed: input.completed,
          notes: input.notes ?? null,
          completionTime: new Date().toISOString(),
        });
      }

      const newStreak = await recalculateStreak(input.habitId, ctx.user.id, input.localDate);

      let xpAwarded = 0;
      let leveledUp = false;

      if (input.completed) {
        const result = await awardXP(ctx.user.id, XP_AMOUNTS.habit_complete, "Habit completed", "habit_complete");
        xpAwarded = result.xpAwarded;
        leveledUp = result.leveledUp;
      }

      await recalculateForgeScore(ctx.user.id);

      const userSnap = await adminDb.collection("users").doc(ctx.user.id).get();
      const forgeScore = userSnap.data()?.forgeScore ?? 0;
      const triggerFortyPercent = !input.completed && prevStreakVal >= 7;

      return { streak: newStreak, forgeScore, xpAwarded, leveledUp, triggerFortyPercent };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const snap = await adminDb.collection("habits").doc(input.id).get();
      if (!snap.exists || snap.data()?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const h = snap.data()!;
      const streakSnap = await adminDb.collection("habit_streaks").doc(input.id).get();
      return {
        id: snap.id,
        name: h.name as string,
        category: h.category as string,
        habit_type: h.habitType as string,
        target_frequency: h.targetFrequency as string,
        target_days: (h.targetDays ?? []) as number[],
        sort_order: (h.sortOrder as number) ?? 0,
        is_active: (h.isActive as boolean) ?? true,
        current_streak: streakSnap.data()?.currentStreak ?? 0,
        longest_streak: streakSnap.data()?.longestStreak ?? 0,
      };
    }),

  getCompletionHistory: protectedProcedure
    .input(z.object({ habitId: z.string(), days: z.number().min(1).max(365) }))
    .query(async ({ ctx, input }) => {
      /* Expand the query window by ±1 day so users in any UTC offset see
         all their completions. habit_completions.localDate is the user's
         local calendar date, which can differ from UTC by up to ±14 hours. */
      const from = new Date();
      from.setDate(from.getDate() - input.days - 1);
      const fromStr = from.toISOString().slice(0, 10);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const toStr = tomorrow.toISOString().slice(0, 10);

      const snap = await adminDb
        .collection("habit_completions")
        .where("habitId", "==", input.habitId)
        .where("userId", "==", ctx.user.id)
        .where("localDate", ">=", fromStr)
        .where("localDate", "<=", toStr)
        .orderBy("localDate")
        .get();

      return snap.docs.map((d) => ({
        localDate: d.data().localDate,
        completed: d.data().completed,
      }));
    }),
});
