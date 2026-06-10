import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || !ctx.userProfile) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      userProfile: ctx.userProfile,
    },
  });
});

const TIER_RANK: Record<string, number> = { free: 0, pro: 1, elite: 2 };

export function requireTier(
  ctx: Context & { userProfile: NonNullable<Context["userProfile"]> },
  minTier: "free" | "pro" | "elite"
) {
  const userRank = TIER_RANK[ctx.userProfile.tier] ?? 0;
  const requiredRank = TIER_RANK[minTier] ?? 0;
  if (userRank < requiredRank) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This feature requires the ${minTier} plan.`,
    });
  }
}
