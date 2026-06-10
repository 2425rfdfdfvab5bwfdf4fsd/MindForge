import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, gte, desc, isNotNull } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { dailyCheckins } from "@/shared/schema";
import { recalculateForgeScore } from "@/lib/streak";
import { awardXP } from "@/lib/xp";
import { checkMirrorGazer } from "@/lib/badges";

export const checkinsRouter = router({
  submit: protectedProcedure
    .input(
      z.object({
        text: z.string(),
        localDate: z.string(),
        onboardingMirror: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const minLen = input.onboardingMirror ? 100 : 50;
      if (input.text.trim().length < minLen) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Reflection must be at least ${minLen} characters.`,
        });
      }

      const [checkin] = await ctx.db
        .insert(dailyCheckins)
        .values({
          userId: ctx.user.id,
          localDate: input.localDate,
          rawReflection: input.text.trim(),
          onboardingMirror: input.onboardingMirror,
          forgeScoreDelta: 0,
        })
        .returning();

      if (!input.onboardingMirror) {
        await awardXP(ctx.user.id, 30, "Daily check-in submitted", "checkin");
        await recalculateForgeScore(ctx.user.id);
        checkMirrorGazer(ctx.user.id).catch(() => {});
      }

      return checkin;
    }),

  getToday: protectedProcedure
    .input(z.object({ localDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const [checkin] = await ctx.db
        .select()
        .from(dailyCheckins)
        .where(
          and(
            eq(dailyCheckins.userId, ctx.user.id),
            eq(dailyCheckins.localDate, input.localDate),
            eq(dailyCheckins.onboardingMirror, false)
          )
        )
        .limit(1);
      return checkin ?? null;
    }),

  updateMetadata: protectedProcedure
    .input(
      z.object({
        checkinId: z.string().uuid(),
        honestyScore: z.number().min(1).max(10).optional(),
        moodSignal: z
          .enum(["excusing", "deflecting", "owning", "crushing"])
          .optional(),
        aiResponse: z.string().optional(),
        forgeScoreDelta: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ userId: dailyCheckins.userId, moodSignal: dailyCheckins.moodSignal })
        .from(dailyCheckins)
        .where(eq(dailyCheckins.id, input.checkinId))
        .limit(1);

      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [updated] = await ctx.db
        .update(dailyCheckins)
        .set({
          ...(input.honestyScore !== undefined ? { honestyScore: input.honestyScore } : {}),
          ...(input.moodSignal !== undefined ? { moodSignal: input.moodSignal } : {}),
          ...(input.aiResponse !== undefined ? { aiResponse: input.aiResponse } : {}),
          ...(input.forgeScoreDelta !== undefined
            ? { forgeScoreDelta: input.forgeScoreDelta }
            : {}),
        })
        .where(eq(dailyCheckins.id, input.checkinId))
        .returning();

      if (input.moodSignal === "crushing" && !existing.moodSignal) {
        await awardXP(ctx.user.id, 20, "Crushing check-in bonus", "checkin_bonus");
      }

      return updated;
    }),

  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: dailyCheckins.id,
          localDate: dailyCheckins.localDate,
          rawReflection: dailyCheckins.rawReflection,
          moodSignal: dailyCheckins.moodSignal,
          honestyScore: dailyCheckins.honestyScore,
          aiResponse: dailyCheckins.aiResponse,
          createdAt: dailyCheckins.createdAt,
        })
        .from(dailyCheckins)
        .where(
          and(
            eq(dailyCheckins.userId, ctx.user.id),
            eq(dailyCheckins.onboardingMirror, false)
          )
        )
        .orderBy(desc(dailyCheckins.localDate))
        .limit(input.limit);
    }),
});
