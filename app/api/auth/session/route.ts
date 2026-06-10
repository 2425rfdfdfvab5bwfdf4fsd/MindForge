import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { sessionCookieOptions, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const expiresIn = 7 * 24 * 60 * 60 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email ?? `${uid}@firebase.user`;
    const displayName = decoded.name ?? null;

    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      await userRef.set({
        id: uid,
        email,
        displayName,
        avatarUrl: decoded.picture ?? null,
        tier: "free",
        onboardingStep: "mirror",
        onboardingComplete: false,
        whyStatement: null,
        identityDeclaration: null,
        coachIntensity: "hard",
        timezone: "UTC",
        forgeScore: 0,
        xp: 0,
        level: 1,
        currentStreakDays: 0,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      await userRef.update({ email, updatedAt: new Date().toISOString() });
    }

    const userData = userSnap.exists ? userSnap.data() : null;
    const onboardingComplete = userData?.onboardingComplete ?? false;
    const onboardingStep = userData?.onboardingStep ?? "mirror";
    const redirectPath = !onboardingComplete
      ? `/onboarding/${onboardingStep}`
      : "/dashboard";

    const response = NextResponse.json({ redirectPath });
    response.cookies.set(COOKIE_NAME, sessionCookie, sessionCookieOptions());
    return response;
  } catch (err) {
    console.error("Session creation error:", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 401 });
  }
}
