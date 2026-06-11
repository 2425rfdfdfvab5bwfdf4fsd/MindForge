import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { adminDb } from "@/lib/firebase/admin";
import { awardXP } from "@/lib/gamification/xp";
import { checkColdMind } from "@/lib/gamification/badges";
import { recalculateForgeScore } from "@/lib/gamification/forge-score";
import { trackServerEvent } from "@/lib/posthog/server";
import type { Challenge } from "@/types";

// The challenge deadline window is 3× the challenge's rated duration.
// e.g. a 30-minute challenge must be completed within 90 minutes.
const CHALLENGE_DEADLINE_FACTOR = 3;

/** Computes the deadline timestamp for an active challenge. */
function challengeDeadlineMs(durationMinutes: number): number {
  return durationMinutes * CHALLENGE_DEADLINE_FACTOR * 60 * 1000;
}

interface ActiveUserChallenge {
  id: string;
  challengeId: string;
  status: string;
  startedAt?: string;
}

export const challengesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const [allSnap, userChalsSnap] = await Promise.all([
      adminDb.collection("challenges").where("isActive", "==", true).get(),
      adminDb
        .collection("user_challenges")
        .where("userId", "==", ctx.user.id)
        .get(),
    ]);

    const now = new Date();
    const userChals = userChalsSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as ActiveUserChallenge))
      .sort((a, b) => {
        const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
        const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
        return bTime - aTime; // most recent first
      });

    // Auto-expire challenges whose deadline has passed
    const toExpire = userChals.filter((uc) => {
      if (uc.status !== "active" || !uc.startedAt) return false;
      const challenge = allSnap.docs.find((c) => c.id === uc.challengeId);
      if (!challenge) return false;
      const dur = challenge.data().durationMinutes as number;
      const expiresAt = new Date(new Date(uc.startedAt).getTime() + challengeDeadlineMs(dur));
      return now > expiresAt;
    });

    if (toExpire.length > 0) {
      await Promise.all(
        toExpire.map((uc) =>
          adminDb.collection("user_challenges").doc(uc.id).update({ status: "failed" })
        )
      );
      toExpire.forEach((uc) => { uc.status = "failed"; });
    }

    return allSnap.docs.map((c) => {
      const cData = c.data();
      const userChallenge = userChals.find((uc) => uc.challengeId === c.id) ?? null;

      let expiresAt: string | null = null;
      if (userChallenge?.status === "active" && userChallenge.startedAt) {
        expiresAt = new Date(
          new Date(userChallenge.startedAt).getTime() +
            challengeDeadlineMs(cData.durationMinutes as number)
        ).toISOString();
      }

      return {
        id: c.id,
        title: cData.title as string,
        description: cData.description as string,
        difficulty: cData.difficulty as 1 | 2 | 3 | 4 | 5,
        category: cData.category as Challenge["category"],
        durationMinutes: cData.durationMinutes as number,
        xpReward: cData.xpReward as number,
        isActive: cData.isActive as boolean,
        userChallenge,
        expiresAt,
      };
    });
  }),

  activate: protectedProcedure
    .input(z.object({ challengeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const chalSnap = await adminDb.collection("challenges").doc(input.challengeId).get();
      if (!chalSnap.exists || !chalSnap.data()?.isActive) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const isFree = ctx.userProfile?.tier === "free";
      if (isFree && (chalSnap.data()?.difficulty ?? 1) > 1) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: JSON.stringify({ upgradeRequired: true }),
        });
      }

      const activeSnap = await adminDb
        .collection("user_challenges")
        .where("userId", "==", ctx.user.id)
        .where("status", "==", "active")
        .limit(1)
        .get();

      if (!activeSnap.empty) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Complete or abandon your current challenge first.",
        });
      }

      const ref = await adminDb.collection("user_challenges").add({
        userId: ctx.user.id,
        challengeId: input.challengeId,
        status: "active",
        startedAt: new Date().toISOString(),
        completedAt: null,
        reflection: null,
      });

      const chalData = chalSnap.data()!;
      trackServerEvent(ctx.user.id, "challenge_activated", {
        challenge_id: input.challengeId,
        category: chalData.category,
        difficulty: chalData.difficulty,
      });

      const snap = await ref.get();
      return { id: ref.id, ...snap.data() };
    }),

  complete: protectedProcedure
    .input(
      z.object({
        userChallengeId: z.string(),
        reflection: z.string().min(50, "Reflection must be at least 50 characters."),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ref = adminDb.collection("user_challenges").doc(input.userChallengeId);
      const snap = await ref.get();

      if (!snap.exists || snap.data()?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (snap.data()?.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Challenge is not active." });
      }

      const chalSnap = await adminDb.collection("challenges").doc(snap.data()!.challengeId).get();
      const xpReward = chalSnap.data()?.xpReward ?? 0;

      await ref.update({
        status: "completed",
        reflection: input.reflection,
        completedAt: new Date().toISOString(),
      });

      let xpResult = null;
      if (xpReward) {
        xpResult = await awardXP(ctx.user.id, xpReward, "Challenge completed", "challenge");
      }

      checkColdMind(ctx.user.id).catch(() => {});
      const newForgeScore = await recalculateForgeScore(ctx.user.id);

      trackServerEvent(ctx.user.id, "challenge_completed", {
        challenge_id: snap.data()!.challengeId,
        xp_awarded: xpReward,
      });

      const updated = await ref.get();
      return {
        userChallenge: { id: ref.id, ...updated.data() },
        xpAwarded: xpReward,
        badgesAwarded: [] as string[],
        newForgeScore,
        leveledUp: xpResult?.leveledUp ?? false,
        newLevel: xpResult?.newLevel ?? 1,
        levelName: xpResult?.levelName ?? "Raw",
      };
    }),
});
