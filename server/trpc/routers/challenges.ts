import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { challenges, userChallenges } from "@/shared/schema";
import { awardXP } from "@/lib/xp";
import { checkColdMind } from "@/lib/badges";
import { recalculateForgeScore } from "@/lib/forge-score";

export const challengesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const all = await ctx.db
      .select()
      .from(challenges)
      .where(eq(challenges.isActive, true));

    const userChals = await ctx.db
      .select()
      .from(userChallenges)
      .where(eq(userChallenges.userId, ctx.user.id))
      .orderBy(desc(userChallenges.startedAt));

    const now = new Date();

    // Auto-expire active challenges past duration_minutes × 3
    const toExpire = userChals.filter((uc) => {
      if (uc.status !== "active" || !uc.startedAt) return false;
      const challenge = all.find((c) => c.id === uc.challengeId);
      if (!challenge) return false;
      const expiresAt = new Date(
        uc.startedAt.getTime() + challenge.durationMinutes * 3 * 60 * 1000
      );
      return now > expiresAt;
    });

    if (toExpire.length > 0) {
      await Promise.all(
        toExpire.map((uc) =>
          ctx.db
            .update(userChallenges)
            .set({ status: "failed" })
            .where(eq(userChallenges.id, uc.id))
        )
      );
      // Reflect the expiry in the in-memory list
      toExpire.forEach((uc) => {
        const found = userChals.find((u) => u.id === uc.id);
        if (found) found.status = "failed";
      });
    }

    return all.map((c) => {
      const userChallenge =
        userChals.find((uc) => uc.challengeId === c.id) ?? null;

      let expiresAt: string | null = null;
      if (
        userChallenge?.status === "active" &&
        userChallenge.startedAt
      ) {
        expiresAt = new Date(
          userChallenge.startedAt.getTime() +
            c.durationMinutes * 3 * 60 * 1000
        ).toISOString();
      }

      return { ...c, userChallenge, expiresAt };
    });
  }),

  activate: protectedProcedure
    .input(z.object({ challengeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [challenge] = await ctx.db
        .select()
        .from(challenges)
        .where(
          and(
            eq(challenges.id, input.challengeId),
            eq(challenges.isActive, true)
          )
        )
        .limit(1);

      if (!challenge) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Free tier: only difficulty-1 challenges
      const isFree = !ctx.userProfile || ctx.userProfile.tier === "free";
      if (isFree && challenge.difficulty > 1) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: JSON.stringify({ upgradeRequired: true }),
        });
      }

      // Max 1 active challenge at a time
      const [existingActive] = await ctx.db
        .select({ id: userChallenges.id })
        .from(userChallenges)
        .where(
          and(
            eq(userChallenges.userId, ctx.user.id),
            eq(userChallenges.status, "active")
          )
        )
        .limit(1);

      if (existingActive) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Complete or abandon your current challenge first.",
        });
      }

      const [uc] = await ctx.db
        .insert(userChallenges)
        .values({
          userId: ctx.user.id,
          challengeId: input.challengeId,
          status: "active",
          startedAt: new Date(),
        })
        .returning();

      return uc;
    }),

  complete: protectedProcedure
    .input(
      z.object({
        userChallengeId: z.string().uuid(),
        reflection: z.string().min(50, "Reflection must be at least 50 characters."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [uc] = await ctx.db
        .select({
          id: userChallenges.id,
          userId: userChallenges.userId,
          challengeId: userChallenges.challengeId,
          status: userChallenges.status,
        })
        .from(userChallenges)
        .where(eq(userChallenges.id, input.userChallengeId))
        .limit(1);

      if (!uc || uc.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (uc.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Challenge is not active.",
        });
      }

      const [challenge] = await ctx.db
        .select({ xpReward: challenges.xpReward, category: challenges.category })
        .from(challenges)
        .where(eq(challenges.id, uc.challengeId))
        .limit(1);

      const [updated] = await ctx.db
        .update(userChallenges)
        .set({
          status: "completed",
          reflection: input.reflection,
          completedAt: new Date(),
        })
        .where(eq(userChallenges.id, input.userChallengeId))
        .returning();

      let xpResult = null;
      if (challenge?.xpReward) {
        xpResult = await awardXP(
          ctx.user.id,
          challenge.xpReward,
          "Challenge completed",
          "challenge"
        );
      }

      // Badge: cold_mind (7+ cold challenges completed — per PRD)
      checkColdMind(ctx.user.id).catch(() => {});

      // Recalculate Forge Score
      const newForgeScore = await recalculateForgeScore(ctx.user.id);

      return {
        userChallenge: updated,
        xpAwarded: challenge?.xpReward ?? 0,
        badgesAwarded: [] as string[],
        newForgeScore,
        leveledUp: xpResult?.leveledUp ?? false,
        newLevel: xpResult?.newLevel ?? 1,
        levelName: xpResult?.levelName ?? "Raw",
      };
    }),
});
