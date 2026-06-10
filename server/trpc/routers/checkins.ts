import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { adminDb } from "@/lib/firebase/admin";
import { recalculateForgeScore } from "@/lib/gamification/streak";
import { awardXP, XP_AMOUNTS } from "@/lib/gamification/xp";
import { checkMirrorGazer } from "@/lib/gamification/badges";
import { trackServerEvent } from "@/lib/posthog/server";
import type { DailyCheckin } from "@/types";

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

      const ref = await adminDb.collection("daily_checkins").add({
        userId: ctx.user.id,
        localDate: input.localDate,
        rawReflection: input.text.trim(),
        onboardingMirror: input.onboardingMirror,
        forgeScoreDelta: 0,
        aiResponse: null,
        moodSignal: null,
        honestyScore: null,
        createdAt: new Date().toISOString(),
      });

      if (!input.onboardingMirror) {
        await awardXP(ctx.user.id, XP_AMOUNTS.checkin, "Daily check-in submitted", "checkin");
        await recalculateForgeScore(ctx.user.id);
        checkMirrorGazer(ctx.user.id).catch(() => {});
        trackServerEvent(ctx.user.id, "checkin_submitted", { has_ai_debrief: (ctx.userProfile?.tier ?? "free") !== "free" });
      }

      const snap = await ref.get();
      return { id: ref.id, ...snap.data() } as DailyCheckin;
    }),

  getToday: protectedProcedure
    .input(z.object({ localDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const snap = await adminDb
        .collection("daily_checkins")
        .where("userId", "==", ctx.user.id)
        .where("localDate", "==", input.localDate)
        .where("onboardingMirror", "==", false)
        .limit(1)
        .get();

      if (snap.empty) return null;
      return { id: snap.docs[0].id, ...snap.docs[0].data() } as DailyCheckin;
    }),

  updateMetadata: protectedProcedure
    .input(
      z.object({
        checkinId: z.string(),
        honestyScore: z.number().min(1).max(10).optional(),
        moodSignal: z
          .enum(["excusing", "deflecting", "owning", "crushing"])
          .optional(),
        aiResponse: z.string().optional(),
        forgeScoreDelta: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ref = adminDb.collection("daily_checkins").doc(input.checkinId);
      const snap = await ref.get();

      if (!snap.exists || snap.data()?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const update: Record<string, unknown> = {};
      if (input.honestyScore !== undefined) update.honestyScore = input.honestyScore;
      if (input.moodSignal !== undefined) update.moodSignal = input.moodSignal;
      if (input.aiResponse !== undefined) update.aiResponse = input.aiResponse;
      if (input.forgeScoreDelta !== undefined) update.forgeScoreDelta = input.forgeScoreDelta;

      await ref.update(update);

      const prevMoodSignal = snap.data()?.moodSignal;
      if (input.moodSignal === "crushing" && !prevMoodSignal) {
        await awardXP(ctx.user.id, XP_AMOUNTS.checkin_bonus, "Crushing check-in bonus", "checkin_bonus");
      }

      const updated = await ref.get();
      return { id: ref.id, ...updated.data() };
    }),

  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const snap = await adminDb
        .collection("daily_checkins")
        .where("userId", "==", ctx.user.id)
        .where("onboardingMirror", "==", false)
        .orderBy("localDate", "desc")
        .limit(input.limit)
        .get();

      return snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          localDate: data.localDate,
          rawReflection: data.rawReflection,
          moodSignal: data.moodSignal,
          honestyScore: data.honestyScore,
          aiResponse: data.aiResponse,
          createdAt: data.createdAt,
        };
      });
    }),
});
