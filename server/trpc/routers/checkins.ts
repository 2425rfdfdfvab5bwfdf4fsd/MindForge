import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const checkinsRouter = router({
  submit: protectedProcedure
    .input(
      z.object({
        localDate: z.string(),
        rawReflection: z.string(),
        onboardingMirror: z.boolean().default(false),
      })
    )
    .mutation(async () => {
      return null;
    }),

  getToday: protectedProcedure
    .input(z.object({ localDate: z.string() }))
    .query(async () => {
      return null;
    }),

  updateMetadata: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        moodSignal: z.enum(["excusing", "deflecting", "owning", "crushing"]).optional(),
        honestyScore: z.number().min(1).max(10).optional(),
        aiResponse: z.string().optional(),
        forgeScoreDelta: z.number().optional(),
      })
    )
    .mutation(async () => {
      return null;
    }),

  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(30) }))
    .query(async () => {
      return [];
    }),
});
