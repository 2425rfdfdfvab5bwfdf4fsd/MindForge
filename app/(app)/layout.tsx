import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { AppShellClient } from "@/components/layout/AppShellClient";
import { MobileNav } from "@/components/layout/MobileNav";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const userDoc = await adminDb.collection("users").doc(session.id).get();
  const profile = userDoc.data();

  if (!profile || !profile.onboardingComplete) {
    const step = profile?.onboardingStep ?? "mirror";
    redirect(`/onboarding/${step}`);
  }

  return (
    <div className="min-h-screen bg-forge-base">
      <AppShellClient
        score={profile.forgeScore ?? 0}
        level={profile.level ?? 1}
        avatarUrl={profile.avatarUrl ?? null}
        displayName={profile.displayName ?? null}
        userTier={profile.tier ?? "free"}
      >
        {children}
      </AppShellClient>

      <MobileNav />

      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "#232220",
            border: "1px solid #2A2927",
            color: "#EDEDEF",
            fontFamily: "var(--font-geist-sans)",
          },
          classNames: {
            success: "border-[#FF6B2B]",
          },
        }}
        position="top-right"
        richColors={false}
      />
    </div>
  );
}
