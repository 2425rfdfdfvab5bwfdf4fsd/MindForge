import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { cookieJarEntries } from "@/shared/schema";
import { awardXP } from "@/lib/xp";
import { checkCookieJarFounder } from "@/lib/badges";

export const cookiejarRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(cookieJarEntries)
      .where(eq(cookieJarEntries.userId, ctx.user.id))
      .orderBy(desc(cookieJarEntries.createdAt));
  }),

  add: protectedProcedure
    .input(
      z.object({
        title: z.string().max(80),
        description: z.string().max(500),
        dateOfVictory: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [entry] = await ctx.db
        .insert(cookieJarEntries)
        .values({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          dateOfVictory: input.dateOfVictory ?? null,
        })
        .returning();

      await awardXP(ctx.user.id, 25, "Cookie Jar entry added", "cookie_jar");
      checkCookieJarFounder(ctx.user.id).catch(() => {});

      return entry;
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
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ userId: cookieJarEntries.userId })
        .from(cookieJarEntries)
        .where(eq(cookieJarEntries.id, input.id))
        .limit(1);

      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [updated] = await ctx.db
        .update(cookieJarEntries)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.dateOfVictory !== undefined
            ? { dateOfVictory: input.dateOfVictory }
            : {}),
        })
        .where(eq(cookieJarEntries.id, input.id))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ userId: cookieJarEntries.userId })
        .from(cookieJarEntries)
        .where(eq(cookieJarEntries.id, input.id))
        .limit(1);

      if (!existing || existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db
        .delete(cookieJarEntries)
        .where(eq(cookieJarEntries.id, input.id));

      return { deleted: true };
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      const all = await ctx.db
        .select()
        .from(cookieJarEntries)
        .where(eq(cookieJarEntries.userId, ctx.user.id))
        .orderBy(desc(cookieJarEntries.createdAt))
        .limit(20);

      const q = input.query.toLowerCase();
      return all.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      );
    }),
});
