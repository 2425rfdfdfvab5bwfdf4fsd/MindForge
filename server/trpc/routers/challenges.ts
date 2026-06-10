import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const challengesRouter = router({
  list: protectedProcedure.query(async () => {
    return [];
  }),

  activate: protectedProcedure
    .input(z.object({ challengeId: z.string().uuid() }))
    .mutation(async () => {
      return null;
    }),

  complete: protectedProcedure
    .input(
      z.object({
        userChallengeId: z.string().uuid(),
        reflection: z.string().optional(),
      })
    )
    .mutation(async () => {
      return null;
    }),
});
