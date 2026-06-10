import { getSession } from "@/lib/auth";
import { db } from "@/server/db";
import { users } from "@/shared/schema";
import { eq } from "drizzle-orm";

export async function createTRPCContext() {
  const session = await getSession();

  let userProfile = null;
  if (session?.id) {
    const [profile] = await db
      .select({
        id: users.id,
        tier: users.tier,
        onboardingComplete: users.onboardingComplete,
        coachIntensity: users.coachIntensity,
      })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);
    userProfile = profile ?? null;
  }

  return {
    db,
    user: session ? { id: session.id, email: session.email } : null,
    userProfile,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
