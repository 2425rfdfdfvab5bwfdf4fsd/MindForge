import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const habitsRouter = router({
  list: protectedProcedure.query(async () => {
    return [];
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().max(60),
        category: z.enum(["health", "mind", "avoid", "perform"]),
        habitType: z.enum(["build", "avoid"]),
        targetFrequency: z.enum(["daily", "weekdays", "custom"]).default("daily"),
        targetDays: z.array(z.number().min(0).max(6)).optional(),
      })
    )
    .mutation(async () => {
      return null;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().max(60).optional(),
        category: z.enum(["health", "mind", "avoid", "perform"]).optional(),
        targetFrequency: z.enum(["daily", "weekdays", "custom"]).optional(),
        targetDays: z.array(z.number().min(0).max(6)).optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async () => {
      return null;
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async () => {
      return null;
    }),

  logCompletion: protectedProcedure
    .input(
      z.object({
        habitId: z.string().uuid(),
        localDate: z.string(),
        completed: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .mutation(async () => {
      return null;
    }),

  getCompletionHistory: protectedProcedure
    .input(
      z.object({
        habitId: z.string().uuid(),
        from: z.string(),
        to: z.string(),
      })
    )
    .query(async () => {
      return [];
    }),
});
