import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { router, protectedProcedure } from "../trpc";

// ---------------------------------------------------------------------------
// Gemini (server-only — this module is only ever imported by tRPC handlers)
// ---------------------------------------------------------------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const flash = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// XP helper shared by multiple mutations
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function grantXP(
  supabase: any,
  userId: string,
  xp: number,
  reason: string,
  eventType: string
) {
  await supabase.from("xp_events").insert({
    user_id: userId,
    xp_amount: xp,
    reason,
    event_type: eventType,
  });
  await supabase.rpc("increment_user_xp", { p_user_id: userId, p_xp: xp });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
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
    .input(z.object({ badgeKey: z.enum(BADGE_KEYS) }))
    .mutation(async ({ ctx, input }) => {
      const { data: badge, error: badgeError } = await ctx.supabase
        .from("user_badges")
        .insert({ user_id: ctx.user.id, badge_key: input.badgeKey })
        .select()
        .single();

      if (badgeError) {
        if (badgeError.code === "23505") return { awarded: false };
        throw badgeError;
      }

      const xp = BADGE_XP[input.badgeKey];
      await grantXP(
        ctx.supabase,
        ctx.user.id,
        xp,
        `Badge earned: ${input.badgeKey}`,
        "badge"
      );

      return { awarded: true, badge };
    }),

  // ---------------------------------------------------------------------------
  // Environment audit
  // ---------------------------------------------------------------------------
  submitEnvironmentAudit: protectedProcedure
    .input(
      z.object({
        answers: z.array(
          z.object({ question: z.string(), answer: z.string() })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Delete any previous items for this user so they can redo if needed
      await ctx.supabase
        .from("environment_audit_items")
        .delete()
        .eq("user_id", ctx.user.id);

      // Build readable answer summary for Gemini
      const answerText = input.answers
        .map((a, i) => `Q${i + 1}: ${a.question}\nAnswer: ${a.answer}`)
        .join("\n\n");

      const prompt = `Based on these environment audit answers:\n\n${answerText}\n\nGenerate 5–8 specific, actionable environment redesign recommendations. Return a JSON array only, no markdown, no explanation:\n[{"item": "...", "category": "..."}]\n\nRules: Each item must be a specific physical action with a specific location (e.g. "Move your phone charger to the kitchen counter tonight" not "Use your phone less"). Reference the user's actual answers. Categories should be one of: Sleep, Focus, Nutrition, Fitness, Mindset, Digital.`;

      let items: Array<{ item: string; category: string }> = [];

      if (process.env.GEMINI_API_KEY) {
        try {
          const result = await flash.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7,
            },
          });
          const raw = result.response.text().trim();
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            items = parsed.slice(0, 8).map((x) => ({
              item: String(x.item ?? x.recommendation ?? ""),
              category: String(x.category ?? "General"),
            }));
          }
        } catch {
          // Fall through to fallback
        }
      }

      // Fallback items when Gemini isn't configured
      if (items.length === 0) {
        items = [
          {
            item: "Move your phone charger to a room other than your bedroom tonight",
            category: "Sleep",
          },
          {
            item: "Place a full water bottle on your desk or countertop right now",
            category: "Nutrition",
          },
          {
            item: "Remove social media apps from your phone's home screen",
            category: "Digital",
          },
          {
            item: "Clear your desk surface of everything except what you need today",
            category: "Focus",
          },
          {
            item: "Put your workout gear somewhere visible before you go to bed",
            category: "Fitness",
          },
        ];
      }

      // Insert into DB
      const rows = items.map((it) => ({
        user_id: ctx.user.id,
        item: it.item,
        category: it.category,
        done: false,
      }));

      const { data, error } = await ctx.supabase
        .from("environment_audit_items")
        .insert(rows)
        .select();

      if (error) throw error;
      return data;
    }),

  getEnvironmentItems: protectedProcedure.query(async ({ ctx }) => {
    const { data } = await ctx.supabase
      .from("environment_audit_items")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: true });
    return data ?? [];
  }),

  markEnvironmentItemDone: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Only award XP once — check if already done
      const { data: existing } = await ctx.supabase
        .from("environment_audit_items")
        .select("done")
        .eq("id", input.itemId)
        .eq("user_id", ctx.user.id)
        .single();

      if (!existing || existing.done) return { awarded: false };

      const { data, error } = await ctx.supabase
        .from("environment_audit_items")
        .update({ done: true, done_at: new Date().toISOString() })
        .eq("id", input.itemId)
        .eq("user_id", ctx.user.id)
        .select()
        .single();

      if (error) throw error;

      await grantXP(
        ctx.supabase,
        ctx.user.id,
        50,
        "Environment audit item completed",
        "environment"
      );

      return { awarded: true, item: data };
    }),

  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    // 200 XP one-time onboarding completion bonus
    await grantXP(
      ctx.supabase,
      ctx.user.id,
      200,
      "Onboarding completed",
      "onboarding"
    );

    const { data, error } = await ctx.supabase
      .from("users")
      .update({
        onboarding_complete: true,
        onboarding_step: "complete",
      })
      .eq("id", ctx.user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }),
});
