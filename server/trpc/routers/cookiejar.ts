import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, count } from "drizzle-orm";
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
        title: z.string().min(1).max(80),
        description: z.string().min(1).max(500),
        dateOfVictory: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Free tier: max 5 entries
      const [{ value: entryCount }] = await ctx.db
        .select({ value: count() })
        .from(cookieJarEntries)
        .where(eq(cookieJarEntries.userId, ctx.user.id));

      const profile = ctx.userProfile;
      const isFree = !profile || profile.tier === "free";

      if (isFree && Number(entryCount) >= 5) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: JSON.stringify({ upgradeRequired: true }),
        });
      }

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

      // Check badge: cookie_jar_founder at 10 entries
      const [{ value: newCount }] = await ctx.db
        .select({ value: count() })
        .from(cookieJarEntries)
        .where(eq(cookieJarEntries.userId, ctx.user.id));

      if (Number(newCount) >= 10) {
        checkCookieJarFounder(ctx.user.id).catch(() => {});
      }

      return entry;
    }),

  edit: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(80).optional(),
        description: z.string().min(1).max(500).optional(),
        dateOfVictory: z.string().nullable().optional(),
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

      const updates: Partial<typeof cookieJarEntries.$inferInsert> = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.description !== undefined) updates.description = input.description;
      if (input.dateOfVictory !== undefined) updates.dateOfVictory = input.dateOfVictory;

      const [updated] = await ctx.db
        .update(cookieJarEntries)
        .set(updates)
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
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const q = `%${input.query}%`;
      const results = await ctx.db
        .select()
        .from(cookieJarEntries)
        .where(
          eq(cookieJarEntries.userId, ctx.user.id)
        )
        .orderBy(desc(cookieJarEntries.createdAt))
        .limit(20);

      // Client-side text scoring (pgvector not available; semantic upgrade path later)
      const words = input.query.toLowerCase().split(/\s+/).filter(Boolean);
      const scored = results
        .map((e) => {
          const corpus = `${e.title} ${e.description}`.toLowerCase();
          const matchCount = words.filter((w) => corpus.includes(w)).length;
          const similarity = matchCount / words.length;
          return { ...e, similarity };
        })
        .filter((e) => e.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      return scored;
    }),
});
