import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const cookiejarRouter = router({
  list: protectedProcedure.query(async () => {
    return [];
  }),

  add: protectedProcedure
    .input(
      z.object({
        title: z.string().max(80),
        description: z.string().max(500),
        dateOfVictory: z.string().optional(),
      })
    )
    .mutation(async () => {
      return null;
    }),

  edit: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().max(80).optional(),
        description: z.string().max(500).optional(),
        dateOfVictory: z.string().optional(),
      })
    )
    .mutation(async () => {
      return null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async () => {
      return null;
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async () => {
      return [];
    }),
});
