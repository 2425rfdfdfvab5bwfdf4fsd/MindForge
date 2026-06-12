import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { adminDb } from "@/lib/firebase/admin";
import { awardXP } from "@/lib/gamification/xp";
import { checkCookieJarFounder } from "@/lib/gamification/badges";
import type { CookieJarEntry } from "@/types";

export const cookiejarRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const snap = await adminDb
      .collection("cookie_jar_entries")
      .where("userId", "==", ctx.user.id)
      .get();
    return snap.docs
      .sort((a, b) =>
        (b.data().createdAt as string).localeCompare(a.data().createdAt as string)
      )
      .map((d) => ({ id: d.id, ...d.data() })) as CookieJarEntry[];
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
      const countSnap = await adminDb
        .collection("cookie_jar_entries")
        .where("userId", "==", ctx.user.id)
        .get();

      const isFree = ctx.userProfile?.tier === "free";
      if (isFree && countSnap.size >= 5) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: JSON.stringify({ upgradeRequired: true }),
        });
      }

      const ref = await adminDb.collection("cookie_jar_entries").add({
        userId: ctx.user.id,
        title: input.title,
        description: input.description,
        dateOfVictory: input.dateOfVictory ?? null,
        createdAt: new Date().toISOString(),
      });

      await awardXP(ctx.user.id, 25, "Cookie Jar entry added", "cookie_jar");

      const newCount = countSnap.size + 1;
      if (newCount >= 10) checkCookieJarFounder(ctx.user.id).catch(() => {});

      const snap = await ref.get();
      return { id: ref.id, ...snap.data() } as CookieJarEntry;
    }),

  edit: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(80).optional(),
        description: z.string().min(1).max(500).optional(),
        dateOfVictory: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const ref = adminDb.collection("cookie_jar_entries").doc(input.id);
      const snap = await ref.get();

      if (!snap.exists || snap.data()?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const update: Record<string, unknown> = {};
      if (input.title !== undefined) update.title = input.title;
      if (input.description !== undefined) update.description = input.description;
      if (input.dateOfVictory !== undefined) update.dateOfVictory = input.dateOfVictory;

      await ref.update(update);
      const updated = await ref.get();
      return { id: ref.id, ...updated.data() } as CookieJarEntry;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const ref = adminDb.collection("cookie_jar_entries").doc(input.id);
      const snap = await ref.get();

      if (!snap.exists || snap.data()?.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ref.delete();
      return { deleted: true };
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const snap = await adminDb
        .collection("cookie_jar_entries")
        .where("userId", "==", ctx.user.id)
        .get();

      const q = input.query.toLowerCase();
      const words = q.split(/\s+/).filter(Boolean);

      const results = snap.docs
        .map((d) => {
          const data = d.data();
          const corpus = `${data.title} ${data.description}`.toLowerCase();
          const matchCount = words.filter((w) => corpus.includes(w)).length;
          return { id: d.id, ...data, similarity: matchCount / words.length };
        })
        .filter((e) => e.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      return results as (CookieJarEntry & { similarity: number })[];
    }),
});
