import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const analyticsRouter = router({
  forgeScoreHistory: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async () => {
      return [];
    }),

  habitCompletionRates: protectedProcedure
    .input(z.object({ days: z.number().default(7) }))
    .query(async () => {
      return [];
    }),

  checkinHonestyTrend: protectedProcedure
    .input(z.object({ days: z.number().default(14) }))
    .query(async () => {
      return [];
    }),

  xpHistory: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async () => {
      return [];
    }),

  getLatestWeeklyReport: protectedProcedure.query(async () => {
    return null;
  }),
});
