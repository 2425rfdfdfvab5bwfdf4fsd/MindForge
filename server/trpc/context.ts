import { getSession } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";

export async function createTRPCContext() {
  const session = await getSession();

  let userProfile = null;
  if (session?.id) {
    const snap = await adminDb.collection("users").doc(session.id).get();
    if (snap.exists) {
      const d = snap.data()!;
      userProfile = {
        id: snap.id,
        tier: (d.tier as string) ?? "free",
        onboardingComplete: (d.onboardingComplete as boolean) ?? false,
        coachIntensity: (d.coachIntensity as string) ?? "hard",
      };
    }
  }

  return {
    user: session ? { id: session.id, email: session.email } : null,
    userProfile,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
