import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { recalculateForgeScore } from "@/lib/streak";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function grantXP(supabase: any, userId: string, xp: number, reason: string, eventType: string) {
  await supabase.from("xp_events").insert({
    user_id: userId,
    xp_amount: xp,
    reason,
    event_type: eventType,
  });
  const { data: user } = await supabase
    .from("users")
    .select("xp, level")
    .eq("id", userId)
    .single();
  if (user) {
    const newXP = (user.xp ?? 0) + xp;
    const newLevel = Math.floor(newXP / 1000) + 1;
    await supabase
      .from("users")
      .update({ xp: newXP, level: newLevel })
      .eq("id", userId);
  }
}

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

      const { data, error } = await ctx.supabase
        .from("daily_checkins")
        .insert({
          user_id: ctx.user.id,
          local_date: input.localDate,
          raw_reflection: input.text.trim(),
          onboarding_mirror: input.onboardingMirror,
          forge_score_delta: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Award 30 XP for regular check-ins only
      if (!input.onboardingMirror) {
        await grantXP(
          ctx.supabase,
          ctx.user.id,
          30,
          "Daily check-in submitted",
          "checkin"
        );
        await recalculateForgeScore(ctx.supabase, ctx.user.id);
      }

      return data;
    }),

  getToday: protectedProcedure
    .input(z.object({ localDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.supabase
        .from("daily_checkins")
        .select("*")
        .eq("user_id", ctx.user.id)
        .eq("local_date", input.localDate)
        .eq("onboarding_mirror", false)
        .maybeSingle();
      return data ?? null;
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
      // Verify ownership
      const { data: existing } = await ctx.supabase
        .from("daily_checkins")
        .select("user_id, mood_signal")
        .eq("id", input.checkinId)
        .single();

      if (!existing || existing.user_id !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { data, error } = await ctx.supabase
        .from("daily_checkins")
        .update({
          honesty_score: input.honestyScore,
          mood_signal: input.moodSignal,
          ai_response: input.aiResponse,
          forge_score_delta: input.forgeScoreDelta,
        })
        .eq("id", input.checkinId)
        .select()
        .single();

      if (error) throw error;

      // Crushing bonus XP — only on first classification
      if (input.moodSignal === "crushing" && !existing.mood_signal) {
        await grantXP(
          ctx.supabase,
          ctx.user.id,
          20,
          "Crushing check-in bonus",
          "checkin_bonus"
        );
      }

      return data;
    }),

  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.supabase
        .from("daily_checkins")
        .select("id, local_date, raw_reflection, mood_signal, honesty_score, ai_response, created_at")
        .eq("user_id", ctx.user.id)
        .eq("onboarding_mirror", false)
        .order("local_date", { ascending: false })
        .limit(input.limit);
      return data ?? [];
    }),
});
