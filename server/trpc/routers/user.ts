import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const { data } = await ctx.supabase
      .from("users")
      .select("*")
      .eq("id", ctx.user.id)
      .single();
    return data;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().optional(),
        coachIntensity: z.enum(["hard", "firm"]).optional(),
        timezone: z.string().optional(),
        onboardingStep: z
          .enum(["mirror", "why", "environment", "complete"])
          .optional(),
        onboardingComplete: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("users")
        .update({
          display_name: input.displayName,
          coach_intensity: input.coachIntensity,
          timezone: input.timezone,
          onboarding_step: input.onboardingStep,
          onboarding_complete: input.onboardingComplete,
        })
        .eq("id", ctx.user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }),

  updateWhy: protectedProcedure
    .input(
      z.object({
        whyStatement: z.string(),
        identityDeclaration: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("users")
        .update({
          why_statement: input.whyStatement,
          identity_declaration: input.identityDeclaration,
        })
        .eq("id", ctx.user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }),

  submitEnvironmentAudit: protectedProcedure
    .input(z.object({ items: z.array(z.unknown()) }))
    .mutation(async () => {
      // Stub — full implementation in environment audit feature
      return [];
    }),

  markEnvironmentItemDone: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async () => {
      // Stub
      return null;
    }),
});
