import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const BADGE_KEYS = [
  "identity_locked",
  "mirror_gazer",
  "cookie_jar_founder",
  "forty_percent_survivor",
  "cold_mind",
  "tempered",
] as const;

type BadgeKey = (typeof BADGE_KEYS)[number];

const BADGE_XP: Record<BadgeKey, number> = {
  identity_locked: 50,
  mirror_gazer: 25,
  cookie_jar_founder: 25,
  forty_percent_survivor: 50,
  cold_mind: 50,
  tempered: 100,
};

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

  awardBadge: protectedProcedure
    .input(
      z.object({
        badgeKey: z.enum(BADGE_KEYS),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Upsert — safe to call multiple times, UNIQUE constraint prevents duplicates
      const { data: badge, error: badgeError } = await ctx.supabase
        .from("user_badges")
        .insert({ user_id: ctx.user.id, badge_key: input.badgeKey })
        .select()
        .single();

      if (badgeError) {
        // Ignore unique violation (badge already awarded)
        if (badgeError.code === "23505") return { awarded: false };
        throw badgeError;
      }

      // Award XP for the badge
      const xp = BADGE_XP[input.badgeKey];
      await ctx.supabase.from("xp_events").insert({
        user_id: ctx.user.id,
        xp_amount: xp,
        reason: `Badge earned: ${input.badgeKey}`,
        event_type: "onboarding",
      });

      // Increment user XP total
      await ctx.supabase.rpc("increment_user_xp", {
        p_user_id: ctx.user.id,
        p_xp: xp,
      });

      return { awarded: true, badge };
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
