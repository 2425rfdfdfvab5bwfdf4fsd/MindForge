import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { challenges, userChallenges } from "@/shared/schema";
import { awardXP } from "@/lib/xp";
import { checkColdMind } from "@/lib/badges";

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

    return all.map((c) => ({
      ...c,
      userChallenge: userChals.find((uc) => uc.challengeId === c.id) ?? null,
    }));
  }),

  activate: protectedProcedure
    .input(z.object({ challengeId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [challenge] = await ctx.db
        .select()
        .from(challenges)
        .where(and(eq(challenges.id, input.challengeId), eq(challenges.isActive, true)))
        .limit(1);

      if (!challenge) {
        throw new TRPCError({ code: "NOT_FOUND" });
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
        reflection: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [uc] = await ctx.db
        .select({ userId: userChallenges.userId, challengeId: userChallenges.challengeId })
        .from(userChallenges)
        .where(eq(userChallenges.id, input.userChallengeId))
        .limit(1);

      if (!uc || uc.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [challenge] = await ctx.db
        .select({ xpReward: challenges.xpReward })
        .from(challenges)
        .where(eq(challenges.id, uc.challengeId))
        .limit(1);

      const [updated] = await ctx.db
        .update(userChallenges)
        .set({
          status: "completed",
          reflection: input.reflection ?? null,
          completedAt: new Date(),
        })
        .where(eq(userChallenges.id, input.userChallengeId))
        .returning();

      if (challenge?.xpReward) {
        await awardXP(
          ctx.user.id,
          challenge.xpReward,
          "Challenge completed",
          "challenge"
        );
      }

      checkColdMind(ctx.user.id).catch(() => {});

      return updated;
    }),
});
