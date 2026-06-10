import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { adminDb } from "@/lib/firebase/admin";
import { awardXP, XP_AMOUNTS } from "@/lib/gamification/xp";
import { checkAndAwardBadge, BADGE_KEYS, type BadgeKey } from "@/lib/gamification/badges";
import type { UserProfile, UserBadge, EnvironmentAuditItem } from "@/types";

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const snap = await adminDb.collection("users").doc(ctx.user.id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...snap.data() } as UserProfile;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().optional(),
        coachIntensity: z.enum(["hard", "firm"]).optional(),
        timezone: z.string().optional(),
        onboardingStep: z.enum(["mirror", "why", "environment", "complete"]).optional(),
        onboardingComplete: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (input.displayName !== undefined) update.displayName = input.displayName;
      if (input.coachIntensity !== undefined) update.coachIntensity = input.coachIntensity;
      if (input.timezone !== undefined) update.timezone = input.timezone;
      if (input.onboardingStep !== undefined) update.onboardingStep = input.onboardingStep;
      if (input.onboardingComplete !== undefined) update.onboardingComplete = input.onboardingComplete;

      const ref = adminDb.collection("users").doc(ctx.user.id);
      await ref.update(update);
      const snap = await ref.get();
      return { id: snap.id, ...snap.data() } as UserProfile;
    }),

  updateWhy: protectedProcedure
    .input(
      z.object({
        whyStatement: z.string(),
        identityDeclaration: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ref = adminDb.collection("users").doc(ctx.user.id);
      await ref.update({
        whyStatement: input.whyStatement,
        identityDeclaration: input.identityDeclaration,
        updatedAt: new Date().toISOString(),
      });
      const snap = await ref.get();
      return { id: snap.id, ...snap.data() } as UserProfile;
    }),

  awardBadge: protectedProcedure
    .input(z.object({ badgeKey: z.enum(BADGE_KEYS) }))
    .mutation(async ({ ctx, input }) => {
      return checkAndAwardBadge(ctx.user.id, input.badgeKey as BadgeKey);
    }),

  submitEnvironmentAudit: protectedProcedure
    .input(
      z.object({
        answers: z.array(z.object({ question: z.string(), answer: z.string() })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Clear existing audit items before regenerating
      const existing = await adminDb
        .collection("environment_audit_items")
        .where("userId", "==", ctx.user.id)
        .get();

      const batch = adminDb.batch();
      existing.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      const answerText = input.answers
        .map((a, i) => `Q${i + 1}: ${a.question}\nAnswer: ${a.answer}`)
        .join("\n\n");

      const prompt = `Based on these environment audit answers:\n\n${answerText}\n\nGenerate 5–8 specific, actionable environment redesign recommendations. Return a JSON array only, no markdown, no explanation:\n[{"item": "...", "category": "..."}]\n\nRules: Each item must be a specific physical action with a specific location. Reference the user's actual answers. Categories should be one of: Sleep, Focus, Nutrition, Fitness, Mindset, Digital.`;

      let items: Array<{ item: string; category: string }> = [];

      if (process.env.GEMINI_API_KEY) {
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const flash = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await flash.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
          });
          const raw = result.response.text().trim();
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            items = parsed.slice(0, 8).map((x) => ({
              item: String(x.item ?? x.recommendation ?? ""),
              category: String(x.category ?? "General"),
            }));
          }
        } catch (err) {
          console.error("[submitEnvironmentAudit] Gemini generation failed:", err);
        }
      }

      // Fallback items when Gemini is unavailable or returns nothing
      if (items.length === 0) {
        items = [
          { item: "Move your phone charger to a room other than your bedroom tonight", category: "Sleep" },
          { item: "Place a full water bottle on your desk or countertop right now", category: "Nutrition" },
          { item: "Remove social media apps from your phone's home screen", category: "Digital" },
          { item: "Clear your desk surface of everything except what you need today", category: "Focus" },
          { item: "Put your workout gear somewhere visible before you go to bed", category: "Fitness" },
        ];
      }

      const inserted: EnvironmentAuditItem[] = [];
      for (const it of items) {
        const ref = await adminDb.collection("environment_audit_items").add({
          userId: ctx.user.id,
          item: it.item,
          category: it.category,
          done: false,
          createdAt: new Date().toISOString(),
        });
        inserted.push({ id: ref.id, item: it.item, category: it.category, done: false });
      }

      return inserted;
    }),

  getEnvironmentItems: protectedProcedure.query(async ({ ctx }) => {
    const snap = await adminDb
      .collection("environment_audit_items")
      .where("userId", "==", ctx.user.id)
      .orderBy("createdAt")
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as EnvironmentAuditItem[];
  }),

  markEnvironmentItemDone: protectedProcedure
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ref = adminDb.collection("environment_audit_items").doc(input.itemId);
      const snap = await ref.get();

      if (!snap.exists || snap.data()?.userId !== ctx.user.id) {
        return { awarded: false };
      }
      if (snap.data()?.done) return { awarded: false };

      await ref.update({ done: true, doneAt: new Date().toISOString() });
      await awardXP(ctx.user.id, XP_AMOUNTS.environment, "Environment audit item completed", "environment");

      return { awarded: true, item: { id: snap.id, ...snap.data(), done: true } };
    }),

  getMemories: protectedProcedure.query(async ({ ctx }) => {
    const snap = await adminDb
      .collection("user_memories")
      .where("userId", "==", ctx.user.id)
      .orderBy("createdAt")
      .get();

    const grouped: Record<string, Array<{ id: string; content: string; created_at: string }>> = {};
    for (const d of snap.docs) {
      const data = d.data();
      const type = data.memoryType as string;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push({ id: d.id, content: data.content, created_at: data.createdAt });
    }
    return grouped;
  }),

  completeOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
    await awardXP(ctx.user.id, XP_AMOUNTS.onboarding, "Onboarding completed", "onboarding");
    const ref = adminDb.collection("users").doc(ctx.user.id);
    await ref.update({
      onboardingComplete: true,
      onboardingStep: "complete",
      updatedAt: new Date().toISOString(),
    });
    const snap = await ref.get();
    return { id: snap.id, ...snap.data() } as UserProfile;
  }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const snap = await adminDb
      .collection("subscriptions")
      .where("userId", "==", ctx.user.id)
      .limit(1)
      .get();
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as {
      id: string;
      userId: string;
      status: "active" | "cancelled" | "expired" | "past_due";
      currentPeriodEnd?: string | null;
      lemonsqueezyCustomerId?: string | null;
      lemonsqueezySubscriptionId?: string | null;
      variantId?: string | null;
      createdAt: string;
      updatedAt: string;
    };
  }),

  getBadges: protectedProcedure.query(async ({ ctx }) => {
    const snap = await adminDb
      .collection("users")
      .doc(ctx.user.id)
      .collection("badges")
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserBadge[];
  }),
});
