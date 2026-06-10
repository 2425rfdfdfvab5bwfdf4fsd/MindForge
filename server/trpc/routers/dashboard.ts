import { router, protectedProcedure } from "../trpc";

export const dashboardRouter = router({
  getAll: protectedProcedure.query(async () => {
    // Stub — returns placeholder data until real implementations land
    return {
      forgeScore: 0,
      xp: 0,
      level: 1,
      currentStreak: 0,
      habitsToday: [],
      latestCheckin: null,
      latestWeeklyReport: null,
    };
  }),
});
