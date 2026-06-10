import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import {
  users,
  userBadges,
  subscriptions,
  environmentAuditItems,
  userMemories,
} from "@/shared/schema";
import { awardXP } from "@/lib/xp";
import { checkAndAwardBadge } from "@/lib/badges";

const BADGE_KEYS = [
  "identity_locked",
  "mirror_gazer",
  "cookie_jar_founder",
  "forty_percent_survivor",
  "cold_mind",
  "tempered",
] as const;

type BadgeKey = (typeof BADGE_KEYS)[number];

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    return profile ?? null;
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
      const [updated] = await ctx.db
        .update(users)
        .set({
          ...(input.displayName !== undefined
            ? { displayName: input.displayName }
            : {}),
          ...(input.coachIntensity !== undefined
            ? { coachIntensity: input.coachIntensity }
            : {}),
          ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
          ...(input.onboardingStep !== undefined
            ? { onboardingStep: input.onboardingStep }
            : {}),
          ...(input.onboardingComplete !== undefined
            ? { onboardingComplete: input.onboardingComplete }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))
        .returning();
      return updated;
    }),

  updateWhy: protectedProcedure
    .input(
      z.object({
        whyStatement: z.string(),
        identityDeclaration: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({
          whyStatement: input.whyStatement,
          identityDeclaration: input.identityDeclaration,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id))
        .returning();
      return updated;
    }),

  awardBadge: protectedProcedure
    .input(z.object({ badgeKey: z.enum(BADGE_KEYS) }))
    .mutation(async ({ ctx, input }) => {
      const result = await checkAndAwardBadge(ctx.user.id, input.badgeKey as BadgeKey);
      return result;
    }),

  submitEnvironmentAudit: protectedProcedure
    .input(
      z.object({
        answers: z.array(
          z.object({ question: z.string(), answer: z.string() })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(environmentAuditItems)
        .where(eq(environmentAuditItems.userId, ctx.user.id));

      const answerText = input.answers
        .map((a, i) => `Q${i + 1}: ${a.question}\nAnswer: ${a.answer}`)
        .join("\n\n");

      const prompt = `Based on these environment audit answers:\n\n${answerText}\n\nGenerate 5–8 specific, actionable environment redesign recommendations. Return a JSON array only, no markdown, no explanation:\n[{"item": "...", "category": "..."}]\n\nRules: Each item must be a specific physical action with a specific location (e.g. "Move your phone charger to the kitchen counter tonight" not "Use your phone less"). Reference the user's actual answers. Categories should be one of: Sleep, Focus, Nutrition, Fitness, Mindset, Digital.`;

      let items: Array<{ item: string; category: string }> = [];

      if (process.env.GEMINI_API_KEY) {
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const flash = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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

      const rows = items.map((it) => ({
        userId: ctx.user.id,
        item: it.item,
        category: it.category,
        done: false,
      }));

      const inserted = await ctx.db
        .insert(environmentAuditItems)
        .values(rows)
        .returning();

      return inserted;
    }),

  getEnvironmentItems: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(environmentAuditItems)
      .where(eq(environmentAuditItems.userId, ctx.user.id))
      .orderBy(environmentAuditItems.createdAt);
  }),

  markEnvironmentItemDone: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ done: environmentAuditItems.done })
        .from(environmentAuditItems)
        .where(
          and(
            eq(environmentAuditItems.id, input.itemId),
            eq(environmentAuditItems.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!existing || existing.done) return { awarded: false };

      const [updated] = await ctx.db
        .update(environmentAuditItems)
        .set({ done: true, doneAt: new Date() })
        .where(
          and(
            eq(environmentAuditItems.id, input.itemId),
            eq(environmentAuditItems.userId, ctx.user.id)
          )
        )
        .returning();

      await awardXP(
        ctx.user.id,
        50,
        "Environment audit item completed",
        "environment"
      );

      return { awarded: true, item: updated };
    }),

  getMemories: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: userMemories.id,
        content: userMemories.content,
        memoryType: userMemories.memoryType,
        createdAt: userMemories.createdAt,
      })
      .from(userMemories)
      .where(eq(userMemories.userId, ctx.user.id))
      .orderBy(userMemories.createdAt);

    const grouped: Record<
      string,
      Array<{ id: string; content: string; created_at: Date | null }>
    > = {};
    for (const m of rows) {
      if (!grouped[m.memoryType]) grouped[m.memoryType] = [];
      grouped[m.memoryType].push({
        id: m.id,
        content: m.content,
        created_at: m.createdAt,
      });
    }
    return grouped;
  }),

  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await awardXP(ctx.user.id, 200, "Onboarding completed", "onboarding");

    const [updated] = await ctx.db
      .update(users)
      .set({ onboardingComplete: true, onboardingStep: "complete", updatedAt: new Date() })
      .where(eq(users.id, ctx.user.id))
      .returning();

    return updated;
  }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const [sub] = await ctx.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id))
      .limit(1);
    return sub ?? null;
  }),

  getBadges: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: userBadges.id,
        badgeKey: userBadges.badgeKey,
        earnedAt: userBadges.earnedAt,
      })
      .from(userBadges)
      .where(eq(userBadges.userId, ctx.user.id));
  }),
});
